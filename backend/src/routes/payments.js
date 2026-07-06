import express from 'express';
import { prisma } from '../lib/prisma.js';
import { stripe } from '../services/stripe.service.js';
import { preference, payment } from '../services/mp.service.js';
import { verifyToken } from '../middleware/auth.js';
import { sendRechargeConfirmation } from '../services/email.service.js';

const router = express.Router();

// POST /api/payments/stripe/create-intent
// Crea un PaymentIntent en Stripe y registra Recharge pendiente
router.post('/stripe/create-intent', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Crear registro Recharge pendiente
    const recharge = await prisma.recharge.create({
      data: {
        userId,
        amount: parseFloat(amount),
        paymentMethod: 'STRIPE',
        status: 'PENDING',
        reference: ''
      }
    });

    // Crear PaymentIntent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Centavos
      currency: 'mxn',
      metadata: {
        rechargeId: recharge.id,
        userId
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      rechargeId: recharge.id,
      amount
    });
  } catch (err) {
    console.error('Error creating PaymentIntent:', err);
    res.status(500).json({ error: 'Error al crear intención de pago' });
  }
});

// POST /api/payments/stripe/webhook
// Webhook que Stripe invoca para notificar pagos completados
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { rechargeId, userId } = paymentIntent.metadata;

      // Verificar si el Recharge ya fue completado (idempotencia)
      const recharge = await prisma.recharge.findUnique({ where: { id: rechargeId } });
      if (recharge?.status === 'COMPLETED') {
        return res.json({ received: true });
      }

      let newBalanceNum = 0;
      let stripeUser = null;

      await prisma.$transaction(async (tx) => {
        await tx.recharge.update({
          where: { id: rechargeId },
          data: { status: 'COMPLETED', reference: paymentIntent.id }
        });

        const user = await tx.user.findUnique({ where: { id: userId } });
        const balanceBefore = parseFloat(user.balance);
        newBalanceNum = balanceBefore + parseFloat(recharge.amount);
        stripeUser = user;

        await tx.user.update({
          where: { id: userId },
          data: { balance: newBalanceNum }
        });

        await tx.transaction.create({
          data: {
            userId,
            type: 'RECHARGE',
            amount: parseFloat(recharge.amount),
            balanceBefore,
            balanceAfter: newBalanceNum,
            paymentMethod: 'STRIPE',
            status: 'COMPLETED',
            description: `Recarga vía Stripe (${paymentIntent.id})`
          }
        });
      });

      if (stripeUser) {
        sendRechargeConfirmation({
          to: stripeUser.email,
          name: stripeUser.name,
          amount: parseFloat(recharge.amount),
          newBalance: newBalanceNum,
          method: 'STRIPE'
        });
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const { rechargeId } = paymentIntent.metadata;

      await prisma.recharge.update({
        where: { id: rechargeId },
        data: { status: 'FAILED' }
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send(`Webhook error: ${err.message}`);
  }
});

// POST /api/payments/mp/create-preference
// Crea preferencia en MercadoPago
router.post('/mp/create-preference', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Crear Recharge pendiente
    const recharge = await prisma.recharge.create({
      data: {
        userId,
        amount: parseFloat(amount),
        paymentMethod: 'MERCADOPAGO',
        status: 'PENDING',
        reference: ''
      }
    });

    // Crear preferencia en MercadoPago
    const mpPreference = await preference.create({
      body: {
        items: [
          {
            title: 'Recarga MealPay',
            unit_price: parseFloat(amount),
            quantity: 1
          }
        ],
        external_reference: recharge.id,
        back_urls: {
          success: `${process.env.API_URL}/api/payments/mp/success`,
          failure: `${process.env.API_URL}/api/payments/mp/failure`
        },
        notification_url: `${process.env.API_URL}/api/payments/mp/webhook`,
        auto_return: 'approved'
      }
    });

    res.json({
      init_point: mpPreference.init_point,
      rechargeId: recharge.id
    });
  } catch (err) {
    console.error('Error creating MP preference:', err);
    res.status(500).json({ error: 'Error al crear preferencia de MercadoPago' });
  }
});

// POST /api/payments/mp/webhook
// IPN de MercadoPago
router.post('/mp/webhook', async (req, res) => {
  try {
    const { id, type, data } = req.body;

    if (type !== 'payment') {
      return res.json({ status: 'skipped' });
    }

    // Consultar detalles del pago en MP (no confiar en el body)
    const mpPayment = await payment.get({ id: data.id });

    // Obtener rechargeId del external_reference
    const rechargeId = mpPayment.external_reference;
    if (!rechargeId) {
      return res.status(400).json({ error: 'external_reference no encontrado' });
    }

    // Verificar si ya fue procesado
    const recharge = await prisma.recharge.findUnique({ where: { id: rechargeId } });
    if (!recharge) {
      return res.status(404).json({ error: 'Recharge no encontrado' });
    }

    if (recharge.status === 'COMPLETED') {
      return res.json({ received: true });
    }

    if (mpPayment.status === 'approved') {
      let newBalanceNum = 0;
      let rechargeUser = null;

      await prisma.$transaction(async (tx) => {
        await tx.recharge.update({
          where: { id: rechargeId },
          data: { status: 'COMPLETED', reference: mpPayment.id.toString() }
        });

        const user = await tx.user.findUnique({ where: { id: recharge.userId } });
        const balanceBefore = parseFloat(user.balance);
        newBalanceNum = balanceBefore + parseFloat(recharge.amount);
        rechargeUser = user;

        await tx.user.update({
          where: { id: recharge.userId },
          data: { balance: newBalanceNum }
        });

        await tx.transaction.create({
          data: {
            userId: recharge.userId,
            type: 'RECHARGE',
            amount: parseFloat(recharge.amount),
            balanceBefore,
            balanceAfter: newBalanceNum,
            paymentMethod: 'MERCADOPAGO',
            status: 'COMPLETED',
            description: `Recarga vía MercadoPago (${mpPayment.id})`
          }
        });
      });

      // Email de confirmación
      if (rechargeUser) {
        sendRechargeConfirmation({
          to: rechargeUser.email,
          name: rechargeUser.name,
          amount: parseFloat(recharge.amount),
          newBalance: newBalanceNum,
          method: 'MERCADOPAGO'
        });
      }
    } else if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
      await prisma.recharge.update({
        where: { id: rechargeId },
        data: { status: 'FAILED' }
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error('MP Webhook error:', err);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

// GET /api/payments/mp/success
// Redirige después de pago exitoso en MP
router.get('/mp/success', async (req, res) => {
  try {
    const { preference_id, payment_id, external_reference } = req.query;

    res.redirect(`/payment/success?external_reference=${external_reference}&payment_id=${payment_id}`);
  } catch (err) {
    console.error('Error in MP success:', err);
    res.redirect('/payment/failed?reason=error');
  }
});

// GET /api/payments/mp/failure
// Redirige después de pago fallido en MP
router.get('/mp/failure', async (req, res) => {
  try {
    const { external_reference } = req.query;

    res.redirect(`/payment/failed?recharge_id=${external_reference}`);
  } catch (err) {
    console.error('Error in MP failure:', err);
    res.redirect('/payment/failed?reason=error');
  }
});

export default router;
