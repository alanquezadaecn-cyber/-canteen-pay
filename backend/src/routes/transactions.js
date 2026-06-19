import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.userId,
      ...(type && { type }),
      ...(startDate || endDate && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      })
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.transaction.count({ where })
    ]);

    const formattedTransactions = transactions.map(t => ({
      ...t,
      amount: t.amount.toString(),
      balanceBefore: t.balanceBefore.toString(),
      balanceAfter: t.balanceAfter.toString()
    }));

    res.json({
      data: formattedTransactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

router.get('/summary', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      userId: req.userId,
      ...(startDate || endDate && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      })
    };

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const summary = {
      totalTransactions: transactions.length,
      totalPurchases: 0,
      totalRecharges: 0,
      totalRefunds: 0,
      purchasesAmount: '0',
      rechargesAmount: '0',
      refundsAmount: '0'
    };

    let purchasesSum = 0;
    let rechargesSum = 0;
    let refundsSum = 0;

    transactions.forEach(t => {
      if (t.type === 'PURCHASE') {
        summary.totalPurchases++;
        purchasesSum += parseFloat(t.amount);
      } else if (t.type === 'RECHARGE') {
        summary.totalRecharges++;
        rechargesSum += parseFloat(t.amount);
      } else if (t.type === 'REFUND') {
        summary.totalRefunds++;
        refundsSum += parseFloat(t.amount);
      }
    });

    summary.purchasesAmount = purchasesSum.toFixed(2);
    summary.rechargesAmount = rechargesSum.toFixed(2);
    summary.refundsAmount = refundsSum.toFixed(2);

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

export default router;
