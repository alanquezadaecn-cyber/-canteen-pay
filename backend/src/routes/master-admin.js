import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware: Verificar que sea Master Admin
const masterAdminOnly = (req, res, next) => {
  // Por ahora, verificamos si el usuario tiene email específico de master admin
  // En producción, agregar un campo isMasterAdmin en User
  const masterAdminEmails = process.env.MASTER_ADMIN_EMAILS?.split(',') || ['master@mealpay.com'];

  if (!masterAdminEmails.includes(req.userEmail)) {
    return res.status(403).json({ error: 'Acceso denegado. Master Admin requerido.' });
  }

  next();
};

router.use(verifyToken, masterAdminOnly);

// GET all branches with payment status
router.get('/branches', async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: { select: { users: true, cashiers: true } },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(branches.map(b => ({
      id: b.id,
      name: b.name,
      location: b.location,
      status: b.isBlocked ? 'BLOQUEADA' : b.licenseStatus,
      users: b._count.users,
      cashiers: b._count.cashiers,
      monthlyFee: b.monthlyFee,
      lastPayment: b.payments[0],
      isBlocked: b.isBlocked,
      blockReason: b.blockReason,
      nextPaymentDate: b.nextPaymentDate,
      licenseExpiry: b.licenseExpiry
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
});

// GET branch details
router.get('/:branchId', async (req, res) => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.branchId },
      include: {
        payments: { orderBy: { createdAt: 'desc' } },
        _count: { select: { users: true, cashiers: true } }
      }
    });

    if (!branch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    res.json(branch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sucursal' });
  }
});

// BLOCK branch
router.post('/:branchId/block', async (req, res) => {
  try {
    const { reason } = req.body;

    const branch = await prisma.branch.update({
      where: { id: req.params.branchId },
      data: {
        isBlocked: true,
        blockReason: reason || 'Bloqueo por Master Admin',
        licenseStatus: 'BLOCKED'
      }
    });

    res.json({ success: true, message: 'Sucursal bloqueada', branch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al bloquear sucursal' });
  }
});

// UNBLOCK branch
router.post('/:branchId/unblock', async (req, res) => {
  try {
    const branch = await prisma.branch.update({
      where: { id: req.params.branchId },
      data: {
        isBlocked: false,
        blockReason: null,
        licenseStatus: 'ACTIVE'
      }
    });

    res.json({ success: true, message: 'Sucursal desbloqueada', branch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desbloquear sucursal' });
  }
});

// CREATE payment
router.post('/:branchId/payment', async (req, res) => {
  try {
    const { amount, description, status = 'PAID', dueDate } = req.body;

    const payment = await prisma.branchPayment.create({
      data: {
        branchId: req.params.branchId,
        amount: parseFloat(amount),
        description,
        status,
        paymentDate: status === 'PAID' ? new Date() : null,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Si se marcó como PAID, actualizar próximo pago
    if (status === 'PAID') {
      await prisma.branch.update({
        where: { id: req.params.branchId },
        data: {
          lastPaymentDate: new Date(),
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          licenseStatus: 'ACTIVE'
        }
      });
    }

    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

// GET payment history
router.get('/:branchId/payments', async (req, res) => {
  try {
    const payments = await prisma.branchPayment.findMany({
      where: { branchId: req.params.branchId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial de pagos' });
  }
});

// GET overdue branches
router.get('/report/overdue', async (req, res) => {
  try {
    const today = new Date();

    const overdue = await prisma.branch.findMany({
      where: {
        AND: [
          { nextPaymentDate: { lt: today } },
          { licenseStatus: 'ACTIVE' },
          { isBlocked: false }
        ]
      },
      include: {
        payments: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    res.json({
      count: overdue.length,
      branches: overdue.map(b => ({
        id: b.id,
        name: b.name,
        daysOverdue: Math.floor((today - b.nextPaymentDate) / (1000 * 60 * 60 * 24)),
        monthlyFee: b.monthlyFee,
        lastPayment: b.payments[0]
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
});

// GET revenue report
router.get('/report/revenue', async (req, res) => {
  try {
    const payments = await prisma.branchPayment.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: 'PAID' }
    });

    const branches = await prisma.branch.findMany({
      select: { monthlyFee: true }
    });

    const totalMonthlyPotential = branches.reduce((sum, b) => sum + parseFloat(b.monthlyFee || 0), 0);

    res.json({
      totalCollected: payments._sum.amount || 0,
      totalPayments: payments._count,
      potentialMonthlyRevenue: totalMonthlyPotential,
      activeBranches: branches.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
});

// UPDATE branch license
router.put('/:branchId/license', async (req, res) => {
  try {
    const { monthlyFee, licenseExpiry, contactEmail, contactPhone } = req.body;

    const branch = await prisma.branch.update({
      where: { id: req.params.branchId },
      data: {
        ...(monthlyFee !== undefined && { monthlyFee: parseFloat(monthlyFee) }),
        ...(licenseExpiry && { licenseExpiry: new Date(licenseExpiry) }),
        ...(contactEmail && { contactEmail }),
        ...(contactPhone && { contactPhone })
      }
    });

    res.json(branch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar licencia' });
  }
});

export default router;
