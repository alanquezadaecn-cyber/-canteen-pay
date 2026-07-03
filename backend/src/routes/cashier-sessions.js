import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, checkRole(['ADMIN', 'CASHIER']));

// OPEN new cashier session
router.post('/open', async (req, res) => {
  try {
    const { branchId, initialFloat = 0 } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: 'Branch requerida' });
    }

    // Check if there's an open session already
    const existingSession = await prisma.cashierSession.findFirst({
      where: {
        branchId,
        status: 'OPEN'
      }
    });

    if (existingSession) {
      return res.status(409).json({ error: 'Ya hay una sesión abierta en esta caja' });
    }

    const session = await prisma.cashierSession.create({
      data: {
        cashierId: req.userId,
        branchId,
        initialFloat: parseFloat(initialFloat),
        status: 'OPEN'
      }
    });

    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al abrir sesión' });
  }
});

// GET current open session
router.get('/current/:branchId', async (req, res) => {
  try {
    const session = await prisma.cashierSession.findFirst({
      where: {
        branchId: req.params.branchId,
        status: 'OPEN'
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'No hay sesión abierta' });
    }

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sesión' });
  }
});

// CLOSE cashier session
router.post('/:sessionId/close', async (req, res) => {
  try {
    const { finalBalance, notes } = req.body;

    const session = await prisma.cashierSession.findUnique({
      where: { id: req.params.sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Get all transactions during this session
    const transactions = await prisma.transaction.findMany({
      where: {
        cashierId: session.cashierId,
        createdAt: {
          gte: session.openedAt,
          lte: new Date()
        }
      }
    });

    const totalCharges = transactions
      .filter(t => t.type === 'PURCHASE')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const updatedSession = await prisma.cashierSession.update({
      where: { id: req.params.sessionId },
      data: {
        closedAt: new Date(),
        finalBalance: finalBalance ? parseFloat(finalBalance) : null,
        totalCharges: totalCharges,
        status: 'CLOSED',
        notes: notes || null
      }
    });

    res.json(updatedSession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

// RECONCILE session (match expected vs actual cash)
router.post('/:sessionId/reconcile', async (req, res) => {
  try {
    const { expectedCash, actualCash, difference, notes } = req.body;

    const session = await prisma.cashierSession.update({
      where: { id: req.params.sessionId },
      data: {
        status: 'RECONCILED',
        notes: `Expected: ${expectedCash}, Actual: ${actualCash}, Diff: ${difference}. ${notes || ''}`
      }
    });

    res.json({
      success: true,
      session,
      reconciliation: {
        expected: expectedCash,
        actual: actualCash,
        difference: difference,
        status: Math.abs(difference) < 1 ? 'OK' : 'DISCREPANCY'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al conciliar sesión' });
  }
});

// GET session history for branch
router.get('/history/:branchId', async (req, res) => {
  try {
    const { limit = 30 } = req.query;

    const sessions = await prisma.cashierSession.findMany({
      where: { branchId: req.params.branchId },
      orderBy: { closedAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

export default router;
