import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, checkRole(['ADMIN', 'CASHIER']));

const MAX_SHIFTS_PER_DAY = 3;

// Mismo criterio de autorización que cashier.js: el cajero solo su propia sucursal,
// el admin cualquier sucursal de su empresa. Sin esto, cualquier cuenta válida podría
// abrir/cerrar turnos de sucursales ajenas.
async function assertBranchAccess(req, branchId) {
  const requester = await prisma.user.findUnique({ where: { id: req.userId }, select: { branchId: true, role: true } });
  if (!requester) return false;
  if (requester.role === 'CASHIER') return requester.branchId === branchId;
  if (requester.role === 'ADMIN') {
    let companyId = req.userCompanyId;
    if (!companyId) {
      const admin = await prisma.user.findUnique({ where: { id: req.userId }, include: { branch: true } });
      companyId = admin?.branch?.companyId || null;
    }
    if (!companyId) return false;
    const targetBranch = await prisma.branch.findUnique({ where: { id: branchId }, select: { companyId: true } });
    return !!targetBranch && targetBranch.companyId === companyId;
  }
  return false;
}
async function requireBranchAccess(req, res, branchId) {
  if (!(await assertBranchAccess(req, branchId))) {
    res.status(403).json({ error: 'No autorizado para esta sucursal' });
    return false;
  }
  return true;
}

function todayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { start, end };
}

// Cuenta platillos (productType PLATILLO) servidos por este cajero en la ventana [from, to)
async function countDishes(cashierId, from, to) {
  const items = await prisma.transactionItem.findMany({
    where: { transaction: { cashierId, createdAt: { gte: from, lt: to } } },
    select: { quantity: true, product: { select: { productType: true } } }
  });
  return items.filter(i => i.product?.productType === 'PLATILLO').reduce((sum, i) => sum + i.quantity, 0);
}

// OPEN new cashier session (abrir turno / apertura de barra)
router.post('/open', async (req, res) => {
  try {
    const { branchId, initialFloat = 0 } = req.body;
    if (!branchId) return res.status(400).json({ error: 'Sucursal requerida' });
    if (!(await requireBranchAccess(req, res, branchId))) return;

    const existingSession = await prisma.cashierSession.findFirst({ where: { branchId, status: 'OPEN' } });
    if (existingSession) return res.status(409).json({ error: 'Ya hay un turno abierto en esta caja' });

    const { start, end } = todayRange();
    const todayCount = await prisma.cashierSession.count({ where: { branchId, openedAt: { gte: start, lt: end } } });
    if (todayCount >= MAX_SHIFTS_PER_DAY) {
      return res.status(409).json({ error: `Ya se abrieron los ${MAX_SHIFTS_PER_DAY} turnos máximos de hoy en esta sucursal` });
    }

    const session = await prisma.cashierSession.create({
      data: {
        cashierId: req.userId, branchId,
        initialFloat: parseFloat(initialFloat) || 0,
        status: 'OPEN', shiftNumber: todayCount + 1
      }
    });
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al abrir turno' });
  }
});

// GET current open session
router.get('/current/:branchId', async (req, res) => {
  try {
    if (!(await requireBranchAccess(req, res, req.params.branchId))) return;
    const session = await prisma.cashierSession.findFirst({ where: { branchId: req.params.branchId, status: 'OPEN' } });
    if (!session) return res.status(404).json({ error: 'No hay turno abierto' });

    const dishesSoFar = await countDishes(session.cashierId, session.openedAt, new Date());
    res.json({ ...session, dishesSoFar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener turno' });
  }
});

// GET turnos de hoy en la sucursal (para mostrar el historial: turno 1/2/3)
router.get('/today/:branchId', async (req, res) => {
  try {
    if (!(await requireBranchAccess(req, res, req.params.branchId))) return;
    const { start, end } = todayRange();
    const sessions = await prisma.cashierSession.findMany({
      where: { branchId: req.params.branchId, openedAt: { gte: start, lt: end } },
      orderBy: { shiftNumber: 'asc' }
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener turnos de hoy' });
  }
});

// CLOSE cashier session (fin de operaciones del turno)
router.post('/:sessionId/close', async (req, res) => {
  try {
    const { finalBalance, notes } = req.body;
    const session = await prisma.cashierSession.findUnique({ where: { id: req.params.sessionId } });
    if (!session) return res.status(404).json({ error: 'Turno no encontrado' });
    if (!(await requireBranchAccess(req, res, session.branchId))) return;
    if (session.status !== 'OPEN') return res.status(409).json({ error: 'Este turno ya está cerrado' });

    const closedAt = new Date();
    const transactions = await prisma.transaction.findMany({
      where: { cashierId: session.cashierId, createdAt: { gte: session.openedAt, lte: closedAt } }
    });
    const totalCharges = transactions.filter(t => t.type === 'PURCHASE').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const dishesCount = await countDishes(session.cashierId, session.openedAt, closedAt);

    const updatedSession = await prisma.cashierSession.update({
      where: { id: req.params.sessionId },
      data: {
        closedAt,
        finalBalance: finalBalance ? parseFloat(finalBalance) : null,
        totalCharges, dishesCount,
        status: 'CLOSED',
        notes: notes || null
      }
    });
    res.json(updatedSession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cerrar turno' });
  }
});

// GET session history for branch
router.get('/history/:branchId', async (req, res) => {
  try {
    if (!(await requireBranchAccess(req, res, req.params.branchId))) return;
    const { limit = 30 } = req.query;
    const sessions = await prisma.cashierSession.findMany({
      where: { branchId: req.params.branchId },
      orderBy: { openedAt: 'desc' },
      take: parseInt(limit)
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

export default router;
