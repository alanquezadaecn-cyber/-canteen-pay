import express from 'express';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, checkRole(['ADMIN']));

const toSlug = (text) =>
  text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);

// Resuelve el companyId del admin autenticado (desde token o vía su sucursal)
async function resolveCompanyId(req) {
  if (req.userCompanyId) return req.userCompanyId;
  const admin = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { branch: true }
  });
  return admin?.branch?.companyId || null;
}

// GET all branches (scoped a la empresa del admin) + info de plan
router.get('/', async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    if (!companyId) return res.json([]);

    const branches = await prisma.branch.findMany({
      where: { companyId },
      include: {
        _count: { select: { users: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Contar cajeros y comensales por separado (ambos son User)
    const withCounts = await Promise.all(branches.map(async (b) => {
      const cashiers = await prisma.user.count({ where: { branchId: b.id, role: 'CASHIER' } });
      const users = await prisma.user.count({ where: { branchId: b.id, role: 'USER' } });
      return { ...b, _count: { cashiers, users } };
    }));

    res.json(withCounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
});

// GET plan info (límite de sucursales y uso actual)
router.get('/plan-info', async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    if (!companyId) return res.json({ maxBranches: 1, used: 0, planName: null });
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { subscription: { include: { plan: true } } }
    });
    const maxBranches = company?.subscription?.plan?.maxBranches ?? 1;
    const used = await prisma.branch.count({ where: { companyId, isActive: true } });
    res.json({ maxBranches, used, planName: company?.subscription?.plan?.name || null });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
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
          where: { role: 'USER' },
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

    const companyId = await resolveCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ error: 'No se pudo determinar tu empresa' });
    }

    // Verificar límite del plan
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { subscription: { include: { plan: true } } }
    });
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const maxBranches = company.subscription?.plan?.maxBranches ?? 1;
    const currentCount = await prisma.branch.count({ where: { companyId, isActive: true } });

    if (currentCount >= maxBranches) {
      return res.status(403).json({
        error: `Tu plan ${company.subscription?.plan?.name || ''} permite hasta ${maxBranches} sucursal${maxBranches === 1 ? '' : 'es'}. Contacta a soporte para ampliar tu plan.`
      });
    }

    // Slug único dentro de la empresa
    let branchSlug = toSlug(name);
    const clash = await prisma.branch.findFirst({ where: { companyId, slug: branchSlug } });
    if (clash) branchSlug = `${branchSlug}-${Date.now().toString().slice(-4)}`;

    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        slug: branchSlug,
        location: location?.trim() || null,
        companyId,
        isActive: true
      }
    });

    // Cajero por defecto
    const cashierEmail = `cajero-${branchSlug}@${company.email.split('@')[1] || 'mealpay.mx'}`;
    const cashierPass = Math.random().toString(36).slice(-8) + '1A';
    const cashierHash = await bcrypt.hash(cashierPass, 10);
    const maxCode = await prisma.user.aggregate({ _max: { employeeNumber: true } });
    let nextNum = 10001;
    const maxStr = maxCode._max?.employeeNumber;
    if (maxStr && /^\d+$/.test(maxStr)) nextNum = parseInt(maxStr) + 1;

    await prisma.user.create({
      data: {
        name: `Cajero ${name.trim()}`,
        email: cashierEmail,
        password: cashierHash,
        role: 'CASHIER',
        employeeNumber: String(nextNum),
        phone: company.phone || '+52 0000-0000',
        qrCode: randomUUID(),
        branchId: branch.id,
        isActive: true
      }
    });

    res.status(201).json({
      ...branch,
      cashier: { email: cashierEmail, password: cashierPass },
      plan: { max: maxBranches, used: currentCount + 1 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear sucursal' });
  }
});

// UPDATE branch — al renombrar, regenera el slug para que la URL coincida con el nombre
router.put('/:id', async (req, res) => {
  try {
    const { name, location, isActive } = req.body;

    const current = await prisma.branch.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Sucursal no encontrada' });

    let slugUpdate = {};
    if (name && name.trim() !== current.name) {
      let newSlug = toSlug(name);
      const clash = await prisma.branch.findFirst({
        where: { companyId: current.companyId, slug: newSlug, id: { not: current.id } }
      });
      if (clash) newSlug = `${newSlug}-${Date.now().toString().slice(-4)}`;
      slugUpdate = { slug: newSlug };
    }

    const branch = await prisma.branch.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...slugUpdate,
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
