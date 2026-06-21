import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { QRService } from '../services/qr.service.js';

const router = express.Router();

router.use(verifyToken, checkRole(['ADMIN']));

router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalUsers, totalBalance, todayTransactions, totalTransactions, users] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.aggregate({ _sum: { balance: true } }),
      prisma.transaction.count({
        where: {
          createdAt: { gte: today, lt: tomorrow }
        }
      }),
      prisma.transaction.count(),
      prisma.user.findMany({
        select: { balance: true }
      })
    ]);

    const todayTransactionsData = await prisma.transaction.findMany({
      where: {
        type: { in: ['PURCHASE', 'RECHARGE'] },
        createdAt: { gte: today, lt: tomorrow }
      }
    });

    const todayRevenue = todayTransactionsData
      .filter(t => t.type === 'PURCHASE')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const todayRecharges = todayTransactionsData
      .filter(t => t.type === 'RECHARGE')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    res.json({
      totalUsers,
      totalBalance: (totalBalance._sum.balance || 0).toFixed(2),
      todayTransactions,
      todayRevenue: todayRevenue.toFixed(2),
      todayRecharges: todayRecharges.toFixed(2),
      totalTransactions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(role && { role })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          employeeNumber: true,
          role: true,
          balance: true,
          isActive: true
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const formatted = users.map(u => ({
      ...u,
      balance: u.balance.toString()
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
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        employeeNumber: true,
        phone: true,
        role: true,
        balance: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    const formatted = transactions.map(t => ({
      ...t,
      amount: t.amount.toString(),
      balanceBefore: t.balanceBefore.toString(),
      balanceAfter: t.balanceAfter.toString()
    }));

    res.json({
      ...user,
      balance: user.balance.toString(),
      transactions: formatted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { name, email, password, company, employeeNumber, phone, role = 'USER' } = req.body;

    if (!name || !email || !password || !company || !employeeNumber || !phone) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const qrCode = require('crypto').randomUUID();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        company,
        employeeNumber,
        phone,
        role,
        qrCode
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        employeeNumber: true,
        phone: true,
        role: true,
        balance: true,
        isActive: true
      }
    });

    res.status(201).json({
      ...user,
      balance: user.balance.toString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, company, employeeNumber, phone, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(company && { company }),
        ...(employeeNumber && { employeeNumber }),
        ...(phone && { phone }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        employeeNumber: true,
        phone: true,
        role: true,
        balance: true,
        isActive: true
      }
    });

    res.json({
      ...user,
      balance: user.balance.toString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.put('/users/:id/balance', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, reason } = req.body;

    if (!amount || !type || !reason) {
      return res.status(400).json({ error: 'Monto, tipo y motivo requeridos' });
    }

    if (!['ADD', 'SUBTRACT'].includes(type)) {
      return res.status(400).json({ error: 'Tipo debe ser ADD o SUBTRACT' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { balance: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const amountNum = parseFloat(amount);
    const balanceBefore = parseFloat(user.balance);
    const balanceAfter = type === 'ADD'
      ? balanceBefore + amountNum
      : balanceBefore - amountNum;

    if (balanceAfter < 0) {
      return res.status(400).json({ error: 'Saldo resultante no puede ser negativo' });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { balance: balanceAfter }
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: id,
          type: type === 'ADD' ? 'RECHARGE' : 'REFUND',
          amount: amountNum,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description: `[AJUSTE ADMIN] ${reason}`,
          cashierId: req.userId,
          paymentMethod: null
        }
      });

      return transaction;
    });

    res.json({
      success: true,
      transaction: {
        ...result,
        amount: result.amount.toString(),
        balanceBefore: result.balanceBefore.toString(),
        balanceAfter: result.balanceAfter.toString()
      },
      newBalance: balanceAfter.toFixed(2),
      userName: user.name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al ajustar saldo' });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 30, type = '', userId = '', cashierId = '', startDate = '', endDate = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(type && { type }),
      ...(userId && { userId }),
      ...(cashierId && { cashierId }),
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
        include: {
          user: { select: { name: true, employeeNumber: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.transaction.count({ where })
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
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

router.get('/cashiers', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const cashiers = await prisma.user.findMany({
      where: { role: { in: ['CASHIER', 'ADMIN'] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    const cashierStats = await Promise.all(
      cashiers.map(async (cashier) => {
        const transactions = await prisma.transaction.findMany({
          where: {
            cashierId: cashier.id,
            createdAt: { gte: today, lt: tomorrow }
          }
        });

        const charges = transactions.filter(t => t.type === 'PURCHASE');
        const recharges = transactions.filter(t => t.type === 'RECHARGE');

        return {
          ...cashier,
          totalCharges: charges.length,
          totalChargesAmount: charges.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2),
          totalRecharges: recharges.length,
          totalRechargesAmount: recharges.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)
        };
      })
    );

    res.json(cashierStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener cajeros' });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const { period = 'today' } = req.query;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startDate, lte: now }
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    const purchases = transactions.filter(t => t.type === 'PURCHASE');
    const recharges = transactions.filter(t => t.type === 'RECHARGE');

    const purchasesTotal = purchases.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const rechargesTotal = recharges.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const activeUsersSet = new Set(transactions.map(t => t.userId));

    const userSpending = {};
    purchases.forEach(t => {
      userSpending[t.user.id] = (userSpending[t.user.id] || 0) + parseFloat(t.amount);
    });

    const topUsers = Object.entries(userSpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, amount]) => {
        const user = transactions.find(t => t.userId === userId)?.user;
        return { userId, name: user?.name, amount: parseFloat(amount).toFixed(2) };
      });

    const dailyBreakdown = {};
    transactions.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = { purchases: 0, recharges: 0, neto: 0 };
      }
      if (t.type === 'PURCHASE') {
        dailyBreakdown[date].purchases += parseFloat(t.amount);
      } else if (t.type === 'RECHARGE') {
        dailyBreakdown[date].recharges += parseFloat(t.amount);
      }
      dailyBreakdown[date].neto = dailyBreakdown[date].recharges - dailyBreakdown[date].purchases;
    });

    res.json({
      period,
      purchasesCount: purchases.length,
      purchasesTotal: purchasesTotal.toFixed(2),
      rechargesCount: recharges.length,
      rechargesTotal: rechargesTotal.toFixed(2),
      activeUsers: activeUsersSet.size,
      topUsers,
      dailyBreakdown: Object.entries(dailyBreakdown)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .reduce((acc, [date, data]) => {
          acc[date] = {
            purchases: data.purchases.toFixed(2),
            recharges: data.recharges.toFixed(2),
            neto: data.neto.toFixed(2)
          };
          return acc;
        }, {})
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});

export default router;
