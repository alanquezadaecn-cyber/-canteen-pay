import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Decimal } from '@prisma/client/runtime/library.js';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';
import { QRService } from '../services/qr.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'canteen-pay-secret-key-2024';

const router = express.Router();

const toSlug = (text) =>
  text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);

// Middleware: Verificar que sea Master Admin
const masterAdminOnly = (req, res, next) => {
  const masterAdminEmails = process.env.MASTER_ADMIN_EMAILS?.split(',') || ['alejandro.qt92@gmail.com', 'master@mealpay.com'];

  if (!masterAdminEmails.includes(req.userEmail)) {
    return res.status(403).json({ error: 'Acceso denegado. Master Admin requerido.' });
  }

  next();
};

router.use(verifyToken, masterAdminOnly);

// Debug endpoint
router.get('/debug/companies-count', async (req, res) => {
  try {
    const count = await prisma.company.count();
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, email: true }
    });
    res.json({ count, companies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET available plans (para el formulario de onboarding)
router.get('/plans', async (req, res) => {
  try {
    // Asegurarse de que los planes base existen
    const plans = await ensurePlansExist();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function ensurePlansExist() {
  const planDefs = [
    {
      name: 'LICENCIA',
      description: 'Licencia anual — $30,000/año. Equivale a $2,500/mes. Ahorro de $6,000 vs mensual.',
      price: 30000,
      billingCycle: 'YEARLY',
      maxBranches: 10,
      maxUsersPerBranch: null,
      features: [
        'Hasta 10 sucursales',
        'Comensales ilimitados',
        'Panel admin + cajero + comensal',
        'Reportes avanzados',
        'Soporte WhatsApp gratis 3 meses',
        'Actualizaciones incluidas',
        'Ahorro de $6,000 vs plan mensual'
      ]
    },
    {
      name: 'PRO',
      description: 'Renta mensual — 2 sucursales + soporte incluido',
      price: 3000,
      billingCycle: 'MONTHLY',
      maxBranches: 2,
      maxUsersPerBranch: null,
      features: [
        'Hasta 2 sucursales',
        'Comensales ilimitados',
        'Panel admin + cajero + comensal',
        'Reportes básicos',
        'Soporte WhatsApp incluido'
      ]
    },
    {
      name: 'ENTERPRISE',
      description: 'Renta mensual — 5 sucursales + soporte prioritario',
      price: 5500,
      billingCycle: 'MONTHLY',
      maxBranches: 5,
      maxUsersPerBranch: null,
      features: [
        'Hasta 5 sucursales',
        'Comensales ilimitados',
        'Panel admin + cajero + comensal',
        'Reportes avanzados',
        'Soporte prioritario 24/7',
        'Actualizaciones incluidas'
      ]
    }
  ];

  const results = [];
  for (const def of planDefs) {
    let plan = await prisma.plan.findUnique({ where: { name: def.name } });
    if (!plan) {
      plan = await prisma.plan.create({ data: def });
    } else {
      // Actualizar si ya existe con los nuevos valores
      plan = await prisma.plan.update({ where: { name: def.name }, data: def });
    }
    results.push(plan);
  }
  return results;
}

// CREATE new company — onboarding completo
// Crea: empresa, suscripción, sucursal, usuario admin, usuario cajero, productos por defecto
router.post('/companies/create', async (req, res) => {
  try {
    const {
      companyName, email, phone, contactPerson, industry,
      planName = 'LICENCIA',
      branchName = 'Comedor Principal',
      branchLocation = 'Planta 1',
      adminPassword
    } = req.body;

    if (!companyName || !email) {
      return res.status(400).json({ error: 'Campos requeridos: companyName, email' });
    }
    if (!adminPassword || adminPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña del admin debe tener al menos 6 caracteres' });
    }

    // Email de empresa no debe existir
    const existingEmail = await prisma.company.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Ya existe una empresa con ese email' });
    }

    // Asegurar planes
    const plans = await ensurePlansExist();
    const plan = plans.find(p => p.name === planName.toUpperCase()) || plans[0];

    // Suscripción (1 año)
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    const subscription = await prisma.subscription.create({
      data: { planId: plan.id, startDate: new Date(), endDate, status: 'ACTIVE' }
    });

    // Generar slugs únicos
    const baseCompanySlug = toSlug(companyName);
    const existingSlug = await prisma.company.findUnique({ where: { slug: baseCompanySlug } });
    const companySlug = existingSlug ? `${baseCompanySlug}-${Date.now().toString().slice(-4)}` : baseCompanySlug;

    // Empresa
    const company = await prisma.company.create({
      data: { name: companyName, slug: companySlug, email, phone, industry, contactPerson, subscriptionId: subscription.id, isActive: true }
    });

    // Sucursal
    const branchSlug = toSlug(branchName);
    const branch = await prisma.branch.create({
      data: { name: branchName, slug: branchSlug, location: branchLocation, companyId: company.id, isActive: true }
    });

    // Admin user
    const adminPass = adminPassword;
    const adminHash = await bcrypt.hash(adminPass, 10);
    const adminUser = await prisma.user.create({
      data: {
        name: contactPerson || `Admin ${companyName}`,
        email,
        password: adminHash,
        role: 'ADMIN',
        employeeNumber: `ADMIN-${Date.now()}`,
        phone: phone || '+52 0000-0000',
        qrCode: QRService.generateUniqueCode(),
        branchId: branch.id,
        isActive: true
      }
    });

    // Cajero user
    const cashierEmail = `cajero@${email.split('@')[1] || 'mealpay.mx'}`;
    const cashierPass = Math.random().toString(36).slice(-8) + '1A';
    const cashierHash = await bcrypt.hash(cashierPass, 10);
    const maxCode = await prisma.user.aggregate({ _max: { employeeNumber: true } });
    let nextNum = 10001;
    const maxStr = maxCode._max?.employeeNumber;
    if (maxStr && /^\d+$/.test(maxStr)) nextNum = parseInt(maxStr) + 1;

    const cashierUser = await prisma.user.create({
      data: {
        name: `Cajero ${branchName}`,
        email: cashierEmail,
        password: cashierHash,
        role: 'CASHIER',
        employeeNumber: String(nextNum),
        phone: phone || '+52 0000-0000',
        qrCode: QRService.generateUniqueCode(),
        branchId: branch.id,
        isActive: true
      }
    });

    // Productos por defecto
    const defaultProducts = [
      { name: 'Comida corrida', price: 65, category: 'Plato del día' },
      { name: 'Tacos (3 pzas)', price: 45, category: 'Antojitos' },
      { name: 'Torta', price: 40, category: 'Antojitos' },
      { name: 'Agua fresca', price: 15, category: 'Bebidas' },
      { name: 'Refresco', price: 20, category: 'Bebidas' }
    ];

    await Promise.all(defaultProducts.map(p =>
      prisma.product.create({ data: { ...p, branchId: branch.id } })
    ));

    const APP_URL = process.env.FRONTEND_URL || 'https://mealpay.up.railway.app';

    res.status(201).json({
      success: true,
      company: { id: company.id, name: company.name, slug: company.slug, plan: plan.name },
      branch: { id: branch.id, name: branch.name, slug: branchSlug, location: branch.location },
      credentials: {
        admin: {
          role: 'Administrador',
          email: adminUser.email,
          password: adminPass,
          url: `${APP_URL}/login/admin/${company.slug}`
        },
        cashier: {
          role: 'Cajero',
          email: cashierUser.email,
          password: cashierPass,
          url: `${APP_URL}/login/${company.slug}/${branchSlug}`,
          branchUrl: `${APP_URL}/caja/${branch.id}`
        }
      },
      urls: {
        adminLogin: `${APP_URL}/login/admin/${company.slug}`,
        cashierLogin: `${APP_URL}/login/${company.slug}/${branchSlug}`,
        comensalRegister: `${APP_URL}/register/${branch.id}`
      },
      defaultProducts: defaultProducts.map(p => p.name)
    });
  } catch (err) {
    console.error('❌ Error creando empresa:', err);
    res.status(500).json({ error: 'Error al crear empresa: ' + err.message });
  }
});

// RESET datos de prueba (solo borra empresas, sucursales, users no-master-admin, productos, transacciones)
router.post('/reset-test-data', async (req, res) => {
  try {
    const masterEmails = process.env.MASTER_ADMIN_EMAILS?.split(',') || ['alejandro.qt92@gmail.com'];
    // Borrar en orden correcto por foreign keys
    await prisma.transactionItem.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.recharge.deleteMany();
    await prisma.product.deleteMany();
    await prisma.cashierSession.deleteMany();
    await prisma.user.deleteMany({ where: { email: { notIn: masterEmails } } });
    await prisma.branch.deleteMany();
    await prisma.companyPayment.deleteMany();
    await prisma.company.deleteMany();
    res.json({ success: true, message: 'Datos de prueba eliminados. Base de datos lista para nueva prueba.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al limpiar: ' + err.message });
  }
});

// GET all companies with branches and payment status
router.get('/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: { select: { branches: true } },
        subscription: { include: { plan: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        branches: { select: { id: true, name: true, isBlocked: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(companies.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      contactPerson: c.contactPerson,
      totalBranches: c._count.branches,
      planName: c.subscription?.plan?.name || 'N/A',
      subscriptionStatus: c.subscription?.status || 'INACTIVE',
      subscriptionEnd: c.subscription?.endDate,
      isActive: c.isActive,
      isBlocked: c.isBlocked,
      blockReason: c.blockReason,
      lastPayment: c.payments[0],
      branches: c.branches
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
});

// UPDATE company details
router.put('/companies/:companyId', async (req, res) => {
  try {
    const { name, email, phone, industry, contactPerson, paymentEmail } = req.body;

    const company = await prisma.company.update({
      where: { id: req.params.companyId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(industry && { industry }),
        ...(contactPerson && { contactPerson }),
        ...(paymentEmail && { paymentEmail })
      }
    });

    res.json({ success: true, company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar empresa' });
  }
});

// GET company details with branches
router.get('/companies/:companyId', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.companyId },
      include: {
        subscription: { include: { plan: true } },
        branches: {
          include: {
            _count: { select: { users: true, cashiers: true } }
          }
        },
        payments: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener empresa' });
  }
});

// BLOCK company (all branches)
router.post('/companies/:companyId/block', async (req, res) => {
  try {
    const { reason } = req.body;

    const company = await prisma.company.update({
      where: { id: req.params.companyId },
      data: {
        isBlocked: true,
        blockReason: reason || 'Bloqueo por Master Admin'
      }
    });

    // Bloquear todas las sucursales
    await prisma.branch.updateMany({
      where: { companyId: req.params.companyId },
      data: {
        isBlocked: true,
        blockReason: reason || 'Empresa bloqueada'
      }
    });

    res.json({ success: true, message: 'Empresa y sucursales bloqueadas', company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al bloquear empresa' });
  }
});

// UNBLOCK company
router.post('/companies/:companyId/unblock', async (req, res) => {
  try {
    const company = await prisma.company.update({
      where: { id: req.params.companyId },
      data: {
        isBlocked: false,
        blockReason: null
      }
    });

    // Desbloquear sucursales
    await prisma.branch.updateMany({
      where: { companyId: req.params.companyId },
      data: {
        isBlocked: false,
        blockReason: null
      }
    });

    res.json({ success: true, message: 'Empresa desbloqueada', company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desbloquear empresa' });
  }
});

// CREATE payment for company
router.post('/companies/:companyId/payment', async (req, res) => {
  try {
    const { amount, description, status = 'PAID', dueDate, invoiceNumber } = req.body;

    const payment = await prisma.companyPayment.create({
      data: {
        companyId: req.params.companyId,
        amount: parseFloat(amount),
        description,
        status,
        invoiceNumber,
        paymentDate: status === 'PAID' ? new Date() : null,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Si se marcó como PAID, actualizar subscription
    if (status === 'PAID') {
      const company = await prisma.company.findUnique({
        where: { id: req.params.companyId },
        include: { subscription: true }
      });

      if (company?.subscription) {
        const newEndDate = new Date(company.subscription.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + 1);

        await prisma.subscription.update({
          where: { id: company.subscription.id },
          data: {
            status: 'ACTIVE',
            renewalDate: newEndDate
          }
        });
      }
    }

    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

// GET payment history
router.get('/companies/:companyId/payments', async (req, res) => {
  try {
    const payments = await prisma.companyPayment.findMany({
      where: { companyId: req.params.companyId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial de pagos' });
  }
});

// GET overdue companies
router.get('/report/overdue', async (req, res) => {
  try {
    const today = new Date();

    const overdue = await prisma.company.findMany({
      where: {
        AND: [
          { subscription: { endDate: { lt: today } } },
          { isBlocked: false }
        ]
      },
      include: {
        subscription: { include: { plan: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    res.json({
      count: overdue.length,
      companies: overdue.map(c => ({
        id: c.id,
        name: c.name,
        planName: c.subscription?.plan?.name,
        daysOverdue: Math.floor((today - c.subscription.endDate) / (1000 * 60 * 60 * 24)),
        subscriptionEnd: c.subscription?.endDate,
        lastPayment: c.payments[0]
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
});

// GET revenue report (agregado a nivel de empresas)
router.get('/report/revenue', async (req, res) => {
  try {
    const payments = await prisma.companyPayment.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: 'PAID' }
    });

    const companies = await prisma.company.findMany({
      where: { isActive: true },
      include: { subscription: { include: { plan: true } } }
    });

    const totalMonthlyPotential = companies.reduce((sum, c) => {
      return sum + parseFloat(c.subscription?.plan?.price || 0);
    }, 0);

    res.json({
      totalCollected: payments._sum.amount || 0,
      totalPayments: payments._count,
      potentialMonthlyRevenue: totalMonthlyPotential,
      activeCompanies: companies.filter(c => !c.isBlocked).length,
      blockedCompanies: companies.filter(c => c.isBlocked).length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
});

// Legacy: GET all branches (para compatibilidad)
router.get('/branches', async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        company: true,
        _count: { select: { users: true, cashiers: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(branches.map(b => ({
      id: b.id,
      name: b.name,
      location: b.location,
      company: b.company.name,
      users: b._count.users,
      cashiers: b._count.cashiers,
      isBlocked: b.isBlocked,
      blockReason: b.blockReason
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
});

// DELETE /companies/:companyId — borrar empresa y todos sus datos
router.delete('/companies/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    // Obtener todas las branches de esta empresa
    const branches = await prisma.branch.findMany({
      where: { companyId },
      select: { id: true }
    });
    const branchIds = branches.map(b => b.id);

    // Obtener todos los usuarios de estas branches
    const users = await prisma.user.findMany({
      where: { branchId: { in: branchIds } },
      select: { id: true }
    });
    const userIds = users.map(u => u.id);

    const subscriptionId = company.subscriptionId;

    // Borrar en orden FK
    await prisma.transactionItem.deleteMany({ where: { transaction: { userId: { in: userIds } } } });
    await prisma.transaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.recharge.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.product.deleteMany({ where: { branchId: { in: branchIds } } });
    await prisma.cashierSession.deleteMany({ where: { branchId: { in: branchIds } } });
    await prisma.user.deleteMany({ where: { branchId: { in: branchIds } } });
    await prisma.branch.deleteMany({ where: { companyId } });
    await prisma.companyPayment.deleteMany({ where: { companyId } });
    // Primero nulificar subscriptionId para liberar FK, luego borrar empresa, luego subscription
    await prisma.company.update({ where: { id: companyId }, data: { subscriptionId: null } });
    await prisma.company.delete({ where: { id: companyId } });
    if (subscriptionId) {
      await prisma.subscription.delete({ where: { id: subscriptionId } });
    }

    res.json({ success: true, message: `Empresa "${company.name}" eliminada` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar empresa: ' + err.message });
  }
});

// GET access link — genera JWT temporal para acceder al panel de una empresa
router.get('/companies/:companyId/access-link', async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { companyId: req.params.companyId },
      select: { id: true }
    });
    if (!branches.length) return res.status(404).json({ error: 'Sin sucursales' });

    const branchIds = branches.map(b => b.id);
    const adminUser = await prisma.user.findFirst({
      where: { branchId: { in: branchIds }, role: 'ADMIN', isActive: true }
    });
    if (!adminUser) return res.status(404).json({ error: 'Admin no encontrado para esta empresa' });

    const token = jwt.sign(
      { sub: adminUser.id, role: adminUser.role, email: adminUser.email, companyId: req.params.companyId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, redirectUrl: '/admin/dashboard', user: { name: adminUser.name, email: adminUser.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando acceso: ' + err.message });
  }
});

export default router;
