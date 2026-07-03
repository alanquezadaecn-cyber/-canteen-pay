import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, checkRole(['CASHIER', 'ADMIN']));

router.get('/scan/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;

    const user = await prisma.user.findUnique({
      where: { qrCode },
      select: {
        id: true,
        name: true,
        email: true,
        branchId: true,
        employeeNumber: true,
        phone: true,
        balance: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    res.json({
      ...user,
      balance: user.balance.toString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al escanear QR' });
  }
});

router.post('/charge', async (req, res) => {
  try {
    const { qrCode, amount, description } = req.body;
    const amountDecimal = parseFloat(amount);

    if (!qrCode || !amountDecimal || amountDecimal <= 0) {
      return res.status(400).json({ error: 'QR y monto válido requeridos' });
    }

    const user = await prisma.user.findUnique({
      where: { qrCode },
      select: { id: true, balance: true, name: true, isActive: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    const balanceDecimal = parseFloat(user.balance);
    if (balanceDecimal < amountDecimal) {
      return res.status(400).json({
        error: 'Saldo insuficiente',
        currentBalance: balanceDecimal.toFixed(2),
        required: amountDecimal.toFixed(2)
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const balanceBefore = parseFloat(user.balance);
      const newBalance = balanceBefore - amountDecimal;

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
        select: { balance: true }
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount: amountDecimal,
          balanceBefore: balanceBefore,
          balanceAfter: newBalance,
          description: description || `Compra en comedor - ${new Date().toLocaleString('es-MX')}`,
          cashierId: req.userId,
          paymentMethod: 'CASH'
        }
      });

      return { transaction, newBalance };
    });

    res.json({
      success: true,
      transaction: {
        ...result.transaction,
        amount: result.transaction.amount.toString(),
        balanceBefore: result.transaction.balanceBefore.toString(),
        balanceAfter: result.transaction.balanceAfter.toString()
      },
      newBalance: result.newBalance.toFixed(2),
      userName: user.name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar pago' });
  }
});

router.post('/recharge', async (req, res) => {
  try {
    const { qrCode, amount } = req.body;
    const amountDecimal = parseFloat(amount);

    if (!qrCode || !amountDecimal || amountDecimal <= 0) {
      return res.status(400).json({ error: 'QR y monto válido requeridos' });
    }

    const user = await prisma.user.findUnique({
      where: { qrCode },
      select: { id: true, balance: true, name: true, isActive: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const balanceBefore = parseFloat(user.balance);
      const newBalance = balanceBefore + amountDecimal;

      await tx.user.update({
        where: { id: user.id },
        data: { balance: newBalance }
      });

      const recharge = await tx.recharge.create({
        data: {
          userId: user.id,
          amount: amountDecimal,
          paymentMethod: 'CASH',
          status: 'COMPLETED',
          reference: `CASH-${Date.now()}`
        }
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'RECHARGE',
          amount: amountDecimal,
          balanceBefore: balanceBefore,
          balanceAfter: newBalance,
          description: `Recarga en efectivo - ${new Date().toLocaleString('es-MX')}`,
          cashierId: req.userId,
          paymentMethod: 'CASH',
          reference: recharge.id
        }
      });

      return { recharge, newBalance };
    });

    res.json({
      success: true,
      recharge: {
        ...result.recharge,
        amount: result.recharge.amount.toString()
      },
      newBalance: result.newBalance.toFixed(2),
      userName: user.name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar recarga' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        cashierId: req.userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const purchases = transactions.filter(t => t.type === 'PURCHASE');
    const recharges = transactions.filter(t => t.type === 'RECHARGE');

    const totalCharges = purchases.length;
    const totalChargesAmount = purchases.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalRecharges = recharges.length;
    const totalRechargesAmount = recharges.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    res.json({
      totalTransactions: transactions.length,
      totalCharges,
      totalChargesAmount: totalChargesAmount.toFixed(2),
      averageCharge: totalCharges > 0 ? (totalChargesAmount / totalCharges).toFixed(2) : '0.00',
      totalRecharges,
      totalRechargesAmount: totalRechargesAmount.toFixed(2),
      date: today.toISOString().split('T')[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          cashierId: req.userId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          user: {
            select: { name: true, employeeNumber: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.transaction.count({
        where: {
          cashierId: req.userId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })
    ]);

    const formatted = transactions.map(t => ({
      ...t,
      amount: t.amount.toString(),
      balanceBefore: t.balanceBefore.toString(),
      balanceAfter: t.balanceAfter.toString()
    }));

    res.json({
      data: formatted,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

export default router;
