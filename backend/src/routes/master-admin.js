import express from 'express';
import bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library.js';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';
import { QRService } from '../services/qr.service.js';

const router = express.Router();

// Middleware: Verificar que sea Master Admin
const masterAdminOnly = (req, res, next) => {
  const masterAdminEmails = process.env.MASTER_ADMIN_EMAILS?.split(',') || ['alejandro.qt92@gmail.com', 'master@mealpay.com'];

  if (!masterAdminEmails.includes(req.userEmail)) {
    return res.status(403).json({ error: 'Acceso denegado. Master Admin requerido.' });
  }

  next();
};

// Debug endpoint (sin autenticación)
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

router.use(verifyToken, masterAdminOnly);

// CREATE new company (para onboarding)
router.post('/companies/create', async (req, res) => {
  try {
    const { name, email, phone, industry, contactPerson, paymentEmail, planId, subdomain } = req.body;

    if (!name || !email || !subdomain || !planId) {
      return res.status(400).json({ error: 'Campos requeridos: name, email, subdomain, planId' });
    }

    // Verificar que el subdominio no exista
    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [
          { id: subdomain },
          { name: { mode: 'insensitive', equals: subdomain } }
        ]
      }
    });

    if (existingCompany) {
      return res.status(409).json({ error: 'El subdominio ya existe' });
    }

    // Verificar que el email de empresa no exista
    const existingEmail = await prisma.company.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return res.status(409).json({ error: 'El email de empresa ya está registrado' });
    }

    // Obtener el plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // Crear subscription
    const licenseRenewalDate = new Date();
    licenseRenewalDate.setFullYear(licenseRenewalDate.getFullYear() + 1);

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        planId,
        startDate: new Date(),
        endDate: licenseRenewalDate,
        renewalDate: licenseRenewalDate,
        status: 'ACTIVE'
      }
    });

    // Definir fees según plan
    let licenseFee = 0;
    let hostingFee = 0;

    if (plan.name === 'ENTERPRISE') {
      licenseFee = 30000;   // $30k/año
      hostingFee = 500;     // $500/mes
    } else if (plan.name === 'LITE') {
      licenseFee = 5000;    // $5k/año
      hostingFee = 150;     // $150/mes
    }

    // Crear company con ID = subdomain (más fácil para routing)
    const company = await prisma.company.create({
      data: {
        id: subdomain,
        name,
        email,
        phone,
        industry,
        contactPerson,
        paymentEmail,
        subscriptionId: subscription.id,
        isActive: true
      },
      include: {
        subscription: { include: { plan: true } }
      }
    });

    // TODO: Agregar factura de licencia cuando se implemente CompanyInvoice table

    // Crear Super Admin user para esta empresa
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const qrCode = QRService.generateUniqueCode();

    const superAdmin = await prisma.user.create({
      data: {
        name: `Admin ${name}`,
        email: email,
        password: hashedPassword,
        role: 'ADMIN',
        employeeNumber: `ADMIN-${Date.now()}`,
        phone: phone || '+52 0000-0000',
        qrCode,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Empresa creada exitosamente',
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        subdomain: company.id,
        plan: company.subscription?.plan?.name,
        pricing: {
          licenseFee: licenseFee,
          hostingFee: `$${hostingFee}/mes`,
          subscriptionEnd: company.subscription?.endDate
        }
      },
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        tempPassword,
        loginUrl: `https://${subdomain}.cashfood.online/admin`
      }
    });
  } catch (err) {
    console.error('❌ Error creando empresa:', err);
    res.status(500).json({ error: 'Error al crear empresa: ' + err.message });
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

export default router;
