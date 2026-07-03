import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, checkRole(['ADMIN']));

// BLOCK user
router.post('/:userId/block', async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        isBlocked: true,
        blockReason: reason || null
      }
    });

    // Create alert
    await prisma.userAlert.create({
      data: {
        userId: user.id,
        type: 'BLOCKED',
        message: `Cuenta bloqueada. Razón: ${reason || 'Sin especificar'}`
      }
    });

    res.json({ success: true, message: 'Usuario bloqueado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al bloquear usuario' });
  }
});

// UNBLOCK user
router.post('/:userId/unblock', async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        isBlocked: false,
        blockReason: null
      }
    });

    res.json({ success: true, message: 'Usuario desbloqueado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desbloquear usuario' });
  }
});

// ADD CREDIT to user
router.post('/:userId/add-credit', async (req, res) => {
  try {
    const { amount, reason } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const newBalance = parseFloat(user.balance.toString()) + parseFloat(amount);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.params.userId },
        data: { balance: newBalance }
      }),
      prisma.transaction.create({
        data: {
          userId: req.params.userId,
          type: 'RECHARGE',
          amount: parseFloat(amount),
          balanceBefore: parseFloat(user.balance.toString()),
          balanceAfter: newBalance,
          description: `Crédito manual: ${reason || 'Sin especificar'}`,
          paymentMethod: 'CASH'
        }
      })
    ]);

    res.json({ success: true, newBalance: newBalance.toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar crédito' });
  }
});

// REMOVE CREDIT from user
router.post('/:userId/remove-credit', async (req, res) => {
  try {
    const { amount, reason } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const currentBalance = parseFloat(user.balance.toString());
    if (currentBalance < parseFloat(amount)) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const newBalance = currentBalance - parseFloat(amount);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.params.userId },
        data: { balance: newBalance }
      }),
      prisma.transaction.create({
        data: {
          userId: req.params.userId,
          type: 'PURCHASE',
          amount: parseFloat(amount),
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Descuento manual: ${reason || 'Sin especificar'}`,
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({ success: true, newBalance: newBalance.toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al remover crédito' });
  }
});

// SET minimum balance threshold
router.post('/:userId/set-min-balance', async (req, res) => {
  try {
    const { minBalance } = req.body;

    if (minBalance === undefined) {
      return res.status(400).json({ error: 'Min balance requerido' });
    }

    await prisma.user.update({
      where: { id: req.params.userId },
      data: { minBalance: parseFloat(minBalance) }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar saldo mínimo' });
  }
});

// GET user alerts
router.get('/:userId/alerts', async (req, res) => {
  try {
    const alerts = await prisma.userAlert.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
});

export default router;
