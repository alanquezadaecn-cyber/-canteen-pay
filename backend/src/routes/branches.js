import express from 'express';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, checkRole(['ADMIN']));

// GET all branches
router.get('/', async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: { cashiers: true, users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(branches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
});

// GET single branch with stats
router.get('/:id', async (req, res) => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.id },
      include: {
        cashiers: {
          select: { id: true, name: true, email: true, isActive: true }
        },
        users: {
          select: { id: true, name: true, email: true, balance: true, isActive: true }
        }
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

// CREATE new branch
router.post('/', async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Nombre de sucursal requerido' });
    }

    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        location: location?.trim() || null
      }
    });

    res.status(201).json(branch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear sucursal' });
  }
});

// UPDATE branch
router.put('/:id', async (req, res) => {
  try {
    const { name, location, isActive } = req.body;

    const branch = await prisma.branch.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(branch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar sucursal' });
  }
});

// CREATE cashier in branch
router.post('/:branchId/cashiers', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const existingCashier = await prisma.cashier.findUnique({
      where: { email }
    });

    if (existingCashier) {
      return res.status(409).json({ error: 'Email ya está en uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const cashier = await prisma.cashier.create({
      data: {
        name: name || email.split('@')[0],
        email,
        password: hashedPassword,
        phone: phone || null,
        branchId: req.params.branchId
      }
    });

    res.status(201).json({
      id: cashier.id,
      name: cashier.name,
      email: cashier.email,
      phone: cashier.phone
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear cajero' });
  }
});

// CREATE user in branch
router.post('/:branchId/users', async (req, res) => {
  try {
    const { name, email, password, employeeNumber, phone } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email ya está en uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const qrCode = randomUUID();

    const user = await prisma.user.create({
      data: {
        name: name || email.split('@')[0],
        email,
        password: hashedPassword,
        employeeNumber: employeeNumber || `EMP-${Date.now()}`,
        phone: phone || '+52 5555-0000',
        qrCode,
        branchId: req.params.branchId,
        role: 'USER'
      }
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      qrCode: user.qrCode
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

export default router;
