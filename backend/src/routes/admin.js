import express from 'express';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { QRService } from '../services/qr.service.js';
import { assertBranchHasRoom, branchUserLimit } from '../lib/limits.js';

const router = express.Router();

router.use(verifyToken, checkRole(['ADMIN']));

async function adminCompanyId(req) {
  if (req.userCompanyId) return req.userCompanyId;
  const admin = await prisma.user.findUnique({ where: { id: req.userId }, include: { branch: true } });
  return admin?.branch?.companyId || null;
}

// GET asistencia (entradas/salidas) por sucursal y día — para el admin
router.get('/attendance', async (req, res) => {
  try {
    const companyId = await adminCompanyId(req);
    if (!companyId) return res.json({ records: [], branches: [] });

    const branches = await prisma.branch.findMany({ where: { companyId }, select: { id: true, name: true } });
    const branchIds = branches.map(b => b.id);

    const day = req.query.date ? new Date(String(req.query.date)) : new Date();
    day.setHours(0, 0, 0, 0);
    const next = new Date(day); next.setDate(next.getDate() + 1);

    const targetBranch = req.query.branchId ? String(req.query.branchId) : null;
    const where = {
      branchId: targetBranch && branchIds.includes(targetBranch) ? targetBranch : { in: branchIds },
      createdAt: { gte: day, lt: next }
    };

    const records = await prisma.attendance.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 });
    const userIds = [...new Set(records.map(r => r.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, position: true, employeeNumber: true, isStaff: true }
    });
    const umap = Object.fromEntries(users.map(u => [u.id, u]));
    const bmap = Object.fromEntries(branches.map(b => [b.id, b.name]));

    res.json({
      branches,
      records: records.map(r => ({
        id: r.id, type: r.type, createdAt: r.createdAt,
        branchName: bmap[r.branchId] || '',
        user: umap[r.userId] || null
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener asistencia' });
  }
});

// ── SUBSIDIO ──
// GET config de subsidio de la empresa
router.get('/subsidy-config', async (req, res) => {
  try {
    const companyId = await adminCompanyId(req);
    if (!companyId) return res.json({ enabled: false, mealsPerDay: 1 });
    const c = await prisma.company.findUnique({ where: { id: companyId }, select: { subsidyEnabled: true, subsidyMealsPerDay: true } });
    res.json({ enabled: !!c?.subsidyEnabled, mealsPerDay: c?.subsidyMealsPerDay ?? 1 });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// PUT config de subsidio
router.put('/subsidy-config', async (req, res) => {
  try {
    const companyId = await adminCompanyId(req);
    if (!companyId) return res.status(400).json({ error: 'No se pudo determinar tu empresa' });
    const { enabled, mealsPerDay } = req.body;
    await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(enabled !== undefined && { subsidyEnabled: !!enabled }),
        ...(mealsPerDay !== undefined && { subsidyMealsPerDay: Math.max(0, parseInt(mealsPerDay) || 0) })
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar' });
  }
});

// GET reporte de subsidio para RH: cuánto se consumió por subsidio (lo que la empresa paga al proveedor)
router.get('/subsidy-report', async (req, res) => {
  try {
    const companyId = await adminCompanyId(req);
    if (!companyId) return res.json({ total: 0, count: 0, byUser: [], branches: [] });

    const branches = await prisma.branch.findMany({ where: { companyId }, select: { id: true, name: true } });
    const branchIds = branches.map(b => b.id);
    const bmap = Object.fromEntries(branches.map(b => [b.id, b.name]));

    // Rango de fechas (default: mes actual)
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    from.setHours(0, 0, 0, 0);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    to.setHours(23, 59, 59, 999);

    const targetBranch = req.query.branchId ? String(req.query.branchId) : null;

    // Comensales de la empresa (o sucursal)
    const users = await prisma.user.findMany({
      where: { branchId: targetBranch && branchIds.includes(targetBranch) ? targetBranch : { in: branchIds } },
      select: { id: true, name: true, employeeNumber: true, branchId: true }
    });
    const umap = Object.fromEntries(users.map(u => [u.id, u]));

    const txns = await prisma.transaction.findMany({
      where: {
        isSubsidized: true,
        userId: { in: users.map(u => u.id) },
        createdAt: { gte: from, lte: to }
      },
      select: { userId: true, amount: true }
    });

    let total = 0;
    const perUser = {};
    for (const t of txns) {
      const amt = parseFloat(t.amount);
      total += amt;
      if (!perUser[t.userId]) perUser[t.userId] = { count: 0, amount: 0 };
      perUser[t.userId].count++;
      perUser[t.userId].amount += amt;
    }

    const byUser = Object.entries(perUser).map(([uid, v]) => ({
      name: umap[uid]?.name || '—',
      employeeNumber: umap[uid]?.employeeNumber || '',
      branchName: bmap[umap[uid]?.branchId] || '',
      count: v.count,
      amount: v.amount.toFixed(2)
    })).sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

    res.json({
      total: total.toFixed(2),
      count: txns.length,
      from: from.toISOString(), to: to.toISOString(),
      branches, byUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// GET config de pagos en línea de la empresa (token enmascarado)
router.get('/payment-config', async (req, res) => {
  try {
    const companyId = await adminCompanyId(req);
    if (!companyId) return res.json({ mpConfigured: false });
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { mpAccessToken: true, mpPublicKey: true }
    });
    const tok = company?.mpAccessToken || '';
    res.json({
      mpConfigured: !!tok,
      mpPublicKey: company?.mpPublicKey || '',
      mpTokenMasked: tok ? `${tok.slice(0, 8)}••••••••${tok.slice(-4)}` : ''
    });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// PUT guardar credenciales MercadoPago de la empresa
router.put('/payment-config', async (req, res) => {
  try {
    const companyId = await adminCompanyId(req);
    if (!companyId) return res.status(400).json({ error: 'No se pudo determinar tu empresa' });
    const { mpAccessToken, mpPublicKey } = req.body;

    const data = {};
    // Permitir limpiar (string vacío) o actualizar
    if (mpAccessToken !== undefined) data.mpAccessToken = mpAccessToken.trim() || null;
    if (mpPublicKey !== undefined) data.mpPublicKey = mpPublicKey.trim() || null;

    // Validación básica del formato del token de MP
    if (data.mpAccessToken && !/^(APP_USR|TEST)-/.test(data.mpAccessToken)) {
      return res.status(400).json({ error: 'El Access Token de MercadoPago debe empezar con APP_USR- (producción) o TEST- (prueba)' });
    }

    await prisma.company.update({ where: { id: companyId }, data });
    res.json({ success: true, mpConfigured: !!data.mpAccessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

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
    const { page = 1, limit = 20, search = '', role = '', branchId = '' } = req.query;
    const skip = (page - 1) * limit;

    const masterEmails = (process.env.MASTER_ADMIN_EMAILS || 'alejandro.qt92@gmail.com,master@mealpay.com').split(',');

    // Sucursales de la empresa del admin (para scoping multi-tenant)
    const admin = await prisma.user.findUnique({ where: { id: req.userId }, include: { branch: true } });
    const companyId = req.userCompanyId || admin?.branch?.companyId;
    let branchIds = [];
    if (companyId) {
      const branches = await prisma.branch.findMany({ where: { companyId }, select: { id: true } });
      branchIds = branches.map(b => b.id);
    }

    const where = {
      email: { notIn: masterEmails },
      // Filtro por sucursal específica, o por todas las de la empresa
      ...(branchId ? { branchId: String(branchId) } : (branchIds.length ? { branchId: { in: branchIds } } : {})),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { employeeNumber: { contains: search } }
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
          branchId: true,
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
        branchId: true,
        employeeNumber: true,
        phone: true,
        role: true,
        balance: true,
        isActive: true,
        qrCode: true,
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
    const { name, email, password, phone, role = 'USER', branchId: bodyBranchId } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Nombre, email, contraseña y teléfono son requeridos' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Obtener branchId del admin si no se proporcionó
    const adminUser = await prisma.user.findUnique({ where: { id: req.userId }, select: { branchId: true } });
    const finalBranchId = bodyBranchId || adminUser?.branchId;

    // Límite de comensales según el plan (solo aplica a comensales)
    if ((role === 'USER' || !role) && finalBranchId) {
      if (!(await assertBranchHasRoom(finalBranchId, res))) return;
    }

    // Generar employeeNumber numérico único
    const maxCode = await prisma.user.aggregate({ _max: { employeeNumber: true } });
    let nextNum = 10001;
    const maxStr = maxCode._max?.employeeNumber;
    if (maxStr && /^\d+$/.test(maxStr)) nextNum = parseInt(maxStr) + 1;

    const hashedPassword = await bcrypt.hash(password, 10);
    const qrCode = QRService.generateUniqueCode();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        employeeNumber: String(nextNum),
        qrCode,
        branchId: finalBranchId || null,
        isActive: true
      },
      select: {
        id: true, name: true, email: true, branchId: true,
        employeeNumber: true, phone: true, role: true, balance: true, isActive: true
      }
    });

    res.status(201).json({ ...user, balance: user.balance.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, employeeNumber, phone, isActive } = req.body;

    // Si cambia el email, verificar que no exista en otro usuario
    if (email) {
      const clash = await prisma.user.findFirst({ where: { email: email.trim().toLowerCase(), id: { not: id } } });
      if (clash) return res.status(409).json({ error: 'Ese email ya está en uso' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(role && { role }),
        ...(employeeNumber && { employeeNumber }),
        ...(phone && { phone }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      select: {
        id: true,
        name: true,
        email: true,
        branchId: true,
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

// ── BULK IMPORT ────────────────────────────────────────────────────────────────
router.post('/users/bulk-import', async (req, res) => {
  try {
    const { branchId, users } = req.body;
    if (!branchId) return res.status(400).json({ error: 'Sucursal requerida' });
    const { bulkImportComensales } = await import('../lib/bulkImport.js');
    const { httpError, result } = await bulkImportComensales(branchId, users);
    if (httpError) return res.status(httpError.status).json({ error: httpError.error });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en importación masiva' });
  }
});

// ── ALERTAS ─────────────────────────────────────────────────────────────────────
router.get('/alerts', async (req, res) => {
  try {
    const { unread } = req.query;
    const alerts = await prisma.userAlert.findMany({
      where: unread === 'true' ? { isRead: false } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        // No hay relación directa, hacemos lookup manual
      }
    });

    // Enrich con nombre de usuario
    const enriched = await Promise.all(alerts.map(async (a) => {
      const user = await prisma.user.findUnique({
        where: { id: a.userId },
        select: { name: true, email: true }
      });
      return { ...a, user };
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
});

router.put('/alerts/:id/read', async (req, res) => {
  try {
    await prisma.userAlert.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al marcar alerta' });
  }
});

router.put('/alerts/read-all', async (req, res) => {
  try {
    await prisma.userAlert.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al marcar alertas' });
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
