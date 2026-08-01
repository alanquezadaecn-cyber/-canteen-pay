import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, checkRole(['ADMIN']));

async function adminCompanyId(req) {
  if (req.userCompanyId) return req.userCompanyId;
  const admin = await prisma.user.findUnique({ where: { id: req.userId }, include: { branch: true } });
  return admin?.branch?.companyId || null;
}

// Verifica que branchId sea una sucursal de la empresa del admin autenticado. Sin esto,
// cualquier admin podía leer ingresos/usuarios/turnos de cualquier sucursal del sistema
// con solo cambiar el branchId en la URL (IDOR).
async function requireBranchInCompany(req, res, branchId) {
  const companyId = await adminCompanyId(req);
  const branch = companyId ? await prisma.branch.findUnique({ where: { id: branchId }, select: { companyId: true } }) : null;
  if (!branch || branch.companyId !== companyId) {
    res.status(404).json({ error: 'Sucursal no encontrada' });
    return false;
  }
  return true;
}

// GET branch statistics
router.get('/branch/:branchId/stats', async (req, res) => {
  try {
    if (!(await requireBranchInCompany(req, res, req.params.branchId))) return;
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const [transactions, users, sessions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          user: { branchId: req.params.branchId },
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.user.findMany({
        where: { branchId: req.params.branchId }
      }),
      prisma.cashierSession.findMany({
        where: {
          branchId: req.params.branchId,
          closedAt: { gte: start, lte: end }
        }
      })
    ]);

    const totalRevenue = transactions
      .filter(t => t.type === 'PURCHASE')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalRecharges = transactions
      .filter(t => t.type === 'RECHARGE')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const topUsers = users
      .map(u => ({
        id: u.id,
        name: u.name,
        totalSpent: transactions
          .filter(t => t.userId === u.id && t.type === 'PURCHASE')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    res.json({
      period: { start, end },
      totalRevenue: totalRevenue.toFixed(2),
      totalRecharges: totalRecharges.toFixed(2),
      totalTransactions: transactions.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalUsers: users.length,
      averageTransactionValue: transactions.length > 0
        ? (totalRevenue / transactions.filter(t => t.type === 'PURCHASE').length).toFixed(2)
        : '0',
      sessions: {
        total: sessions.length,
        totalCharges: sessions.reduce((sum, s) => sum + parseFloat(s.totalCharges || 0), 0).toFixed(2)
      },
      topUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});

// GET daily revenue report
router.get('/branch/:branchId/daily', async (req, res) => {
  try {
    if (!(await requireBranchInCompany(req, res, req.params.branchId))) return;
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const transactions = await prisma.transaction.findMany({
      where: {
        user: { branchId: req.params.branchId },
        type: 'PURCHASE',
        createdAt: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1)
        }
      }
    });

    const daily = {};
    transactions.forEach(t => {
      const day = new Date(t.createdAt).getDate();
      if (!daily[day]) daily[day] = 0;
      daily[day] += parseFloat(t.amount);
    });

    res.json({
      month: currentMonth,
      year: currentYear,
      daily: Object.entries(daily).map(([day, amount]) => ({
        day: parseInt(day),
        revenue: amount.toFixed(2)
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reporte diario' });
  }
});

// GET user history in detail
router.get('/user/:userId/history', async (req, res) => {
  try {
    const companyId = await adminCompanyId(req);
    const targetUser = await prisma.user.findUnique({ where: { id: req.params.userId }, include: { branch: true } });
    // Sin esto, un admin podía leer el historial completo (montos, saldo, email) de
    // CUALQUIER comensal del sistema con solo conocer su ID.
    if (!targetUser || targetUser.branch?.companyId !== companyId) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { limit = 50 } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.params.userId },
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      user: { name: targetUser.name, email: targetUser.email, balance: targetUser.balance, createdAt: targetUser.createdAt },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        items: t.items,
        createdAt: t.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// GET cashier session details
router.get('/cashier-session/:sessionId', async (req, res) => {
  try {
    const session = await prisma.cashierSession.findUnique({
      where: { id: req.params.sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Sin esto, un admin podía leer el detalle de cualquier turno de caja del sistema.
    if (!(await requireBranchInCompany(req, res, session.branchId))) return;

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sesión' });
  }
});

export default router;
