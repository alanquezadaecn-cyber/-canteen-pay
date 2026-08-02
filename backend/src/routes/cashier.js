import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { sendRechargeConfirmation, sendPurchaseNotification } from '../services/email.service.js';
import { assertBranchHasRoom, branchUserLimit } from '../lib/limits.js';
import { sendPushToUser } from '../lib/push.js';

const router = express.Router();

router.use(verifyToken, checkRole(['CASHIER', 'ADMIN']));

// Notificación in-app (campanita del comensal) + push del navegador. No bloquea la
// respuesta del cobro/recarga ni la tumba si falla — es "mejor esfuerzo".
function notifyUser(userId, { type, message, title, url }) {
  prisma.userAlert.create({ data: { userId, type, message } }).catch(() => {});
  sendPushToUser(userId, { title, body: message, url }).catch(() => {});
}

// Verifica que el cajero/admin autenticado tenga permiso para operar sobre branchId.
// CASHIER: debe ser exactamente su propia sucursal. ADMIN: la sucursal debe pertenecer
// a su misma empresa. Sin este chequeo, cualquier cuenta válida podría leer o mover
// saldo de comensales de OTRAS sucursales/empresas con solo cambiar el branchId en la URL.
async function assertBranchAccess(req, branchId) {
  const requester = await prisma.user.findUnique({ where: { id: req.userId }, select: { branchId: true, role: true } });
  if (!requester) return false;
  if (requester.role === 'CASHIER') {
    return requester.branchId === branchId;
  }
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

// Si el cobro corresponde a un producto de la tiendita (snack) con stock rastreado,
// lo descuenta de forma atómica y deja el detalle en TransactionItem para que el
// inventario de Caja/Admin refleje la venta real. Los platillos del menú y los
// productos sin seguimiento de stock (isTracked:false o stock:-1 = "sin límite")
// no tocan inventario, solo quedan registrados en TransactionItem para reportes.
async function applyProductSale(tx, productId, transactionId, cashierId) {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) return;

  if (product.productType === 'PRODUCTO' && product.isTracked && product.stock !== -1) {
    const { count } = await tx.product.updateMany({
      where: { id: productId, stock: { gte: 1 } },
      data: { stock: { decrement: 1 } }
    });
    if (count === 0) throw new Error('OUT_OF_STOCK');
    await tx.stockMovement.create({
      data: {
        productId, type: 'SALE', quantity: -1,
        prevStock: product.stock, newStock: product.stock - 1,
        note: 'Venta en caja', createdBy: cashierId
      }
    });
  }

  await tx.transactionItem.create({
    data: { transactionId, productId, quantity: 1, unitPrice: product.price, subtotal: product.price }
  });
}

// GET branch info for cashier
router.get('/branch/:branchId', async (req, res) => {
  try {
    if (!(await requireBranchAccess(req, res, req.params.branchId))) return;
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.branchId },
      select: {
        id: true,
        name: true,
        location: true,
        companyId: true
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

// SCAN / BUSCAR comensal en la sucursal por QR, # empleado, email, teléfono o nombre
router.get('/branch/:branchId/scan/:qrCode', async (req, res) => {
  try {
    const { branchId, qrCode } = req.params;
    if (!(await requireBranchAccess(req, res, branchId))) return;
    const term = decodeURIComponent(qrCode).trim();
    const select = {
      id: true, name: true, email: true, branchId: true,
      employeeNumber: true, phone: true, balance: true,
      isActive: true, qrCode: true
    };

    // 1) Coincidencia EXACTA (QR, email, # empleado, teléfono) — comensales de la sucursal
    let user = await prisma.user.findFirst({
      where: {
        branchId,
        role: 'USER',
        OR: [
          { qrCode: term },
          { email: term.toLowerCase() },
          { employeeNumber: term },
          { phone: term }
        ]
      },
      select
    });

    // 2) Si no hubo exacta, buscar por nombre/email/teléfono parcial
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          branchId,
          role: 'USER',
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { email: { contains: term.toLowerCase() } },
            { phone: { contains: term } }
          ]
        },
        orderBy: { name: 'asc' },
        select
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'Comensal no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Comensal inactivo' });
    }

    // Info de subsidio: cuántas comidas subsidiadas le quedan hoy + niveles disponibles
    let subsidy = { enabled: false, limit: 0, usedToday: 0, left: 0, tiers: [] };
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { company: { select: { id: true, subsidyEnabled: true, subsidyMealsPerDay: true } } }
    });
    if (branch?.company?.subsidyEnabled) {
      const cfg = await prisma.user.findUnique({ where: { id: user.id }, select: { subsidyMealsPerDay: true } });
      const limit = (cfg?.subsidyMealsPerDay ?? branch.subsidyMealsPerDay ?? branch.company.subsidyMealsPerDay) || 0;
      const t0 = new Date(); t0.setHours(0, 0, 0, 0);
      const t1 = new Date(t0); t1.setDate(t1.getDate() + 1);
      const usedToday = await prisma.transaction.count({
        where: { userId: user.id, isSubsidized: true, createdAt: { gte: t0, lt: t1 } }
      });
      // Solo niveles de ESTA sucursal, o los que aplican a toda la empresa (branchId null)
      const tiers = await prisma.subsidyTier.findMany({
        where: { companyId: branch.company.id, isActive: true, OR: [{ branchId }, { branchId: null }] },
        orderBy: { cost: 'asc' },
        select: { id: true, name: true, cost: true }
      });
      subsidy = {
        enabled: true, limit, usedToday, left: Math.max(0, limit - usedToday),
        tiers: tiers.map(t => ({ ...t, cost: t.cost.toString() }))
      };
    }

    res.json({
      ...user,
      balance: user.balance.toString(),
      subsidy
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al buscar comensal' });
  }
});

// CREATE comensal desde caja — el cajero da de alta un usuario en SU sucursal
router.post('/branch/:branchId/register', async (req, res) => {
  try {
    const { branchId } = req.params;
    const { name, email, phone, password, employeeNumber, position, isStaff, photoUrl } = req.body;
    const staff = !!isStaff || !!position;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Validar que el cajero pertenece a esa sucursal (admin puede en cualquiera de su empresa)
    if (!(await requireBranchAccess(req, res, branchId))) return;

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) return res.status(404).json({ error: 'Sucursal no encontrada' });

    // Límite de comensales según el plan (el equipo de operación NO cuenta como comensal)
    if (!staff && !(await assertBranchHasRoom(branchId, res))) return;

    // Email: usar el dado, o generar uno interno si no hay (muchos comensales no tienen email)
    let finalEmail = email?.trim().toLowerCase();
    if (finalEmail) {
      const existing = await prisma.user.findUnique({ where: { email: finalEmail } });
      if (existing) return res.status(409).json({ error: 'Ese email ya está registrado' });
    }

    // employeeNumber: usar el dado o auto-generar consecutivo
    const { QRService } = await import('../services/qr.service.js');
    const bcrypt = await import('bcrypt');

    let empNum = employeeNumber?.trim();
    if (!empNum) {
      const maxCode = await prisma.user.aggregate({ _max: { employeeNumber: true } });
      let nextNum = 10001;
      const maxStr = maxCode._max?.employeeNumber;
      if (maxStr && /^\d+$/.test(maxStr)) nextNum = parseInt(maxStr) + 1;
      empNum = String(nextNum);
    }

    // Si no dieron email, generar uno interno único basado en el número de empleado
    if (!finalEmail) {
      finalEmail = `comensal-${empNum}-${Date.now().toString().slice(-4)}@${branch.slug || 'mealpay'}.local`;
    }

    const { gen8DigitPassword } = await import('../lib/bulkImport.js');
    const plainPassword = password?.trim() || gen8DigitPassword(); // 8 dígitos autogenerada
    const hashedPassword = await bcrypt.default.hash(plainPassword, 10);
    const qrCode = QRService.generateUniqueCode();

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: finalEmail,
        password: hashedPassword,
        phone: phone?.trim() || '+52 0000-0000',
        role: 'USER',
        employeeNumber: empNum,
        qrCode,
        branchId,
        isActive: true,
        isStaff: staff,
        position: position?.trim() || null,
        photoUrl: photoUrl || null
      }
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeNumber: user.employeeNumber,
        qrCode: user.qrCode,
        password: plainPassword,
        position: user.position,
        isStaff: user.isStaff,
        photoUrl: user.photoUrl
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar comensal: ' + err.message });
  }
});

// LIST comensales de la sucursal (para el panel de caja)
router.get('/branch/:branchId/users', async (req, res) => {
  try {
    const { branchId } = req.params;
    const { search, page, limit, sort, isStaff } = req.query;

    if (!(await requireBranchAccess(req, res, branchId))) return;

    const where = {
      branchId,
      role: 'USER',
      ...(isStaff !== undefined && { isStaff: isStaff === 'true' }),
      ...(search ? {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } },
          { employeeNumber: { contains: String(search) } }
        ]
      } : {})
    };
    const orderBy = sort === 'employeeNumber' ? { employeeNumber: 'asc' } : { name: 'asc' };
    const select = { id: true, name: true, email: true, employeeNumber: true, phone: true, balance: true, qrCode: true, isActive: true, position: true, isStaff: true, photoUrl: true };

    // Sin page: modo "lista completa" (lo usa el cache offline de caja, que necesita
    // poder buscar a CUALQUIER comensal sin conexión, no solo los primeros 100).
    if (page === undefined) {
      const users = await prisma.user.findMany({ where, select, orderBy, take: 2000 });
      return res.json(users.map(u => ({ ...u, balance: u.balance.toString() })));
    }

    // Modo paginado: para la lista visible en pantalla.
    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [users, total, comensalCount, staffCount] = await Promise.all([
      prisma.user.findMany({ where, select, orderBy, skip, take: limitNum }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { branchId, role: 'USER', isStaff: false } }),
      prisma.user.count({ where: { branchId, role: 'USER', isStaff: true } })
    ]);

    res.json({
      data: users.map(u => ({ ...u, balance: u.balance.toString() })),
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
      counts: { comensal: comensalCount, staff: staffCount }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener comensales' });
  }
});

// BULK IMPORT de comensales desde caja (scoped a la sucursal del cajero)
router.post('/branch/:branchId/bulk-import', async (req, res) => {
  try {
    const { branchId } = req.params;
    const { users } = req.body;

    if (!(await requireBranchAccess(req, res, branchId))) return;

    const { bulkImportComensales } = await import('../lib/bulkImport.js');
    const { httpError, result } = await bulkImportComensales(branchId, users);
    if (httpError) return res.status(httpError.status).json({ error: httpError.error });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en importación masiva' });
  }
});

// ── ASISTENCIA (entradas/salidas por QR, sin login del empleado) ──
// El cajero tiene su panel abierto; los empleados solo escanean su QR.
router.post('/branch/:branchId/attendance/scan', async (req, res) => {
  try {
    const { branchId } = req.params;
    if (!(await requireBranchAccess(req, res, branchId))) return;
    const term = (req.body.qrCode || '').toString().replace(/^#/, '').trim();
    if (!term) return res.status(400).json({ error: 'QR o número requerido' });

    // Resolver persona por QR, # empleado, email o nombre — dentro de la sucursal
    let person = await prisma.user.findFirst({
      where: {
        branchId,
        OR: [{ qrCode: term }, { employeeNumber: term }, { email: term.toLowerCase() }]
      },
      select: { id: true, name: true, position: true, isStaff: true, isActive: true }
    });
    if (!person) {
      person = await prisma.user.findFirst({
        where: { branchId, name: { contains: term, mode: 'insensitive' } },
        select: { id: true, name: true, position: true, isStaff: true, isActive: true }
      });
    }
    if (!person) return res.status(404).json({ error: 'Persona no encontrada en esta sucursal' });
    if (!person.isActive) return res.status(403).json({ error: 'Cuenta inactiva' });

    // Determinar IN/OUT según el último registro de HOY
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const last = await prisma.attendance.findFirst({
      where: { userId: person.id, createdAt: { gte: today } },
      orderBy: { createdAt: 'desc' }
    });
    const type = last?.type === 'IN' ? 'OUT' : 'IN';

    const record = await prisma.attendance.create({
      data: { userId: person.id, branchId, type }
    });

    res.json({
      success: true,
      type,
      name: person.name,
      position: person.position || (person.isStaff ? 'Equipo de operación' : 'Comensal'),
      time: record.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar asistencia' });
  }
});

// GET registros de asistencia del día (para el panel de caja)
router.get('/branch/:branchId/attendance', async (req, res) => {
  try {
    const { branchId } = req.params;
    if (!(await requireBranchAccess(req, res, branchId))) return;
    const day = req.query.date ? new Date(String(req.query.date)) : new Date();
    day.setHours(0, 0, 0, 0);
    const next = new Date(day); next.setDate(next.getDate() + 1);

    const records = await prisma.attendance.findMany({
      where: { branchId, createdAt: { gte: day, lt: next } },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    const userIds = [...new Set(records.map(r => r.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, position: true, employeeNumber: true, isStaff: true }
    });
    const umap = Object.fromEntries(users.map(u => [u.id, u]));

    res.json(records.map(r => ({
      id: r.id, type: r.type, createdAt: r.createdAt,
      user: umap[r.userId] || null
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener asistencia' });
  }
});

// LÍMITE de comensales de la sucursal (uso vs máximo del plan)
router.get('/branch/:branchId/limit', async (req, res) => {
  try {
    if (!(await requireBranchAccess(req, res, req.params.branchId))) return;
    const info = await branchUserLimit(req.params.branchId);
    res.json(info);
  } catch (err) {
    res.json({ max: null, used: 0, allowed: true });
  }
});

// EDIT comensal de la sucursal (nombre, teléfono, email, # empleado, activo)
router.put('/branch/:branchId/users/:userId', async (req, res) => {
  try {
    const { branchId, userId } = req.params;
    const { name, phone, email, employeeNumber, isActive } = req.body;

    if (!(await requireBranchAccess(req, res, branchId))) return;

    // El comensal debe pertenecer a esta sucursal
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true, role: true } });
    if (!target || target.branchId !== branchId || target.role !== 'USER') {
      return res.status(403).json({ error: 'Comensal no encontrado en esta sucursal' });
    }

    if (email) {
      const clash = await prisma.user.findFirst({ where: { email: email.trim().toLowerCase(), id: { not: userId } } });
      if (clash) return res.status(409).json({ error: 'Ese email ya está en uso' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || '+52 0000-0000' }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(employeeNumber && { employeeNumber: employeeNumber.trim() }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      select: { id: true, name: true, email: true, employeeNumber: true, phone: true, balance: true, qrCode: true, isActive: true }
    });

    res.json({ ...user, balance: user.balance.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar comensal' });
  }
});

// CHARGE en sucursal específica
router.post('/branch/:branchId/charge', async (req, res) => {
  try {
    const { branchId } = req.params;
    if (!(await requireBranchAccess(req, res, branchId))) return;
    const { qrCode, amount, description, clientRef, subsidized, productId, subsidyTierId, isCashSale, cashReceived } = req.body;
    const amountDecimal = parseFloat(amount);

    if (!qrCode || !amountDecimal || amountDecimal <= 0) {
      return res.status(400).json({ error: 'QR y monto válido requeridos' });
    }

    // Idempotencia: si esta operación (clientRef) ya se aplicó, devolver el resultado
    // sin volver a cobrar. Clave para la sincronización del modo offline.
    if (clientRef) {
      const existing = await prisma.transaction.findFirst({ where: { reference: clientRef } });
      if (existing) {
        const u = await prisma.user.findUnique({ where: { id: existing.userId }, select: { name: true, balance: true } });
        return res.json({
          success: true, duplicate: true,
          transaction: { ...existing, amount: existing.amount.toString() },
          newBalance: (u?.balance || 0).toString(),
          userName: u?.name
        });
      }
    }

    // Buscar por QR o por email
    let user = await prisma.user.findUnique({
      where: { qrCode },
      select: { id: true, balance: true, name: true, isActive: true, branchId: true }
    });

    // Si no encontró por QR, intenta por email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: qrCode },
        select: { id: true, balance: true, name: true, isActive: true, branchId: true }
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.branchId !== branchId) {
      return res.status(403).json({ error: 'Usuario no pertenece a esta sucursal' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // ── PAGO EN EFECTIVO DIRECTO: el comensal paga en mano en caja, no toca su saldo de
    // la app. Se registra con cuánto pagó y cuánto se le dio de cambio, para el corte. ──
    if (isCashSale) {
      const cashReceivedDecimal = parseFloat(cashReceived);
      if (!cashReceivedDecimal || cashReceivedDecimal < amountDecimal) {
        return res.status(400).json({ error: 'El efectivo recibido debe cubrir el monto del cobro' });
      }
      const balanceNow = parseFloat(user.balance);
      const change = cashReceivedDecimal - amountDecimal;

      let cashResult;
      try {
        cashResult = await prisma.$transaction(async (tx) => {
          const created = await tx.transaction.create({
            data: {
              userId: user.id, type: 'PURCHASE', amount: amountDecimal,
              balanceBefore: balanceNow, balanceAfter: balanceNow,
              description: description || `Compra en efectivo`,
              cashierId: req.userId, isCashSale: true,
              cashReceived: cashReceivedDecimal, cashChange: change,
              reference: clientRef || null
            }
          });
          if (productId) await applyProductSale(tx, productId, created.id, req.userId);
          return created;
        });
      } catch (txErr) {
        if (txErr.message === 'OUT_OF_STOCK') {
          return res.status(400).json({ error: 'Sin existencias de este producto' });
        }
        throw txErr;
      }

      notifyUser(user.id, {
        type: 'PURCHASE',
        title: 'Compra en efectivo',
        message: `${description || 'Compra'} pagada en efectivo: $${amountDecimal.toFixed(2)}`,
        url: '/purchases'
      });

      return res.json({
        success: true, cashSale: true,
        transaction: { ...cashResult, amount: cashResult.amount.toString() },
        newBalance: balanceNow.toFixed(2), userName: user.name,
        cashReceived: cashReceivedDecimal.toFixed(2), change: change.toFixed(2)
      });
    }

    // ── COBRO SUBSIDIADO: la empresa cubre la comida, no descuenta saldo, solo se marca ──
    if (subsidized) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        include: { company: { select: { id: true, subsidyEnabled: true, subsidyMealsPerDay: true } } }
      });
      if (!branch?.company?.subsidyEnabled) {
        return res.status(400).json({ error: 'El subsidio no está habilitado para esta empresa' });
      }
      if (!subsidyTierId) {
        return res.status(400).json({ error: 'Elige un nivel de subsidio (ej. Estándar, Especial)' });
      }
      const tier = await prisma.subsidyTier.findUnique({ where: { id: subsidyTierId } });
      if (!tier || tier.companyId !== branch.company.id || !tier.isActive) {
        return res.status(400).json({ error: 'Nivel de subsidio inválido' });
      }
      // Un nivel asignado a otra sucursal (branchId distinto y no "todas") no se puede cobrar aquí
      if (tier.branchId && tier.branchId !== branchId) {
        return res.status(400).json({ error: 'Este nivel de subsidio no aplica a esta sucursal' });
      }
      const userCfg = await prisma.user.findUnique({ where: { id: user.id }, select: { subsidyMealsPerDay: true } });
      const limit = (userCfg?.subsidyMealsPerDay ?? branch.subsidyMealsPerDay ?? branch.company.subsidyMealsPerDay) || 0;
      // El monto que se registra como subsidio es el costo del nivel elegido (lo que
      // realmente paga la empresa), no el precio de venta de ningún platillo.
      const subsidyAmount = parseFloat(tier.cost);

      const t0 = new Date(); t0.setHours(0, 0, 0, 0);
      const t1 = new Date(t0); t1.setDate(t1.getDate() + 1);
      const balanceNow = parseFloat(user.balance);

      // Lock por fila del usuario: serializa cobros subsidiados concurrentes del MISMO
      // comensal para que el conteo de "usadas hoy" no pueda leerse dos veces en paralelo
      // y dejar pasar más comidas subsidiadas de las que el plan permite.
      let subsidyResult;
      try {
        subsidyResult = await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
          const usedToday = await tx.transaction.count({
            where: { userId: user.id, isSubsidized: true, createdAt: { gte: t0, lt: t1 } }
          });
          if (usedToday >= limit) throw new Error('SUBSIDY_LIMIT_REACHED');

          const created = await tx.transaction.create({
            data: {
              userId: user.id, type: 'PURCHASE', amount: subsidyAmount,
              balanceBefore: balanceNow, balanceAfter: balanceNow,
              description: `Subsidiado (${tier.name})${description ? `: ${description}` : ''}`,
              cashierId: req.userId, isSubsidized: true, reference: clientRef || null
            }
          });
          if (productId) await applyProductSale(tx, productId, created.id, req.userId);
          return { created, subsidyLeft: limit - usedToday - 1 };
        });
      } catch (txErr) {
        if (txErr.message === 'SUBSIDY_LIMIT_REACHED') {
          return res.status(400).json({ error: `Ya usó sus ${limit} comida(s) subsidiada(s) de hoy` });
        }
        if (txErr.message === 'OUT_OF_STOCK') {
          return res.status(400).json({ error: 'Sin existencias de este producto' });
        }
        throw txErr;
      }

      notifyUser(user.id, {
        type: 'SUBSIDIZED',
        title: 'Comida subsidiada',
        message: `${description || 'Comida'} marcada como subsidiada. Te quedan ${subsidyResult.subsidyLeft} hoy.`,
        url: '/purchases'
      });

      return res.json({
        success: true, subsidized: true,
        transaction: { ...subsidyResult.created, amount: subsidyResult.created.amount.toString() },
        newBalance: balanceNow.toFixed(2), userName: user.name,
        subsidyLeft: subsidyResult.subsidyLeft
      });
    }

    const balanceDecimal = parseFloat(user.balance);
    if (balanceDecimal < amountDecimal) {
      return res.status(400).json({
        error: 'Saldo insuficiente',
        currentBalance: balanceDecimal.toFixed(2),
        required: amountDecimal.toFixed(2)
      });
    }

    // Verificar límite diario
    const userFull = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dailyLimit: true }
    });
    const dailyLimit = parseFloat(userFull?.dailyLimit || 0);
    if (dailyLimit > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const todayPurchases = await prisma.transaction.aggregate({
        where: { userId: user.id, type: 'PURCHASE', createdAt: { gte: today, lt: tomorrow } },
        _sum: { amount: true }
      });
      const todayTotal = parseFloat(todayPurchases._sum.amount || 0);
      if (todayTotal + amountDecimal > dailyLimit) {
        return res.status(400).json({
          error: `Límite diario alcanzado. Límite: $${dailyLimit.toFixed(2)}, gastado hoy: $${todayTotal.toFixed(2)}`
        });
      }
    }

    // Débito atómico: el WHERE con balance >= amount evita que dos cobros concurrentes
    // al mismo comensal se pisen (lost update) y dejen un saldo incorrecto.
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        const { count } = await tx.user.updateMany({
          where: { id: user.id, balance: { gte: amountDecimal } },
          data: { balance: { decrement: amountDecimal } }
        });
        if (count === 0) throw new Error('INSUFFICIENT_BALANCE');

        const updatedUser = await tx.user.findUnique({ where: { id: user.id }, select: { balance: true } });
        const newBalance = parseFloat(updatedUser.balance);
        const balanceBefore = newBalance + amountDecimal;

        const transaction = await tx.transaction.create({
          data: {
            userId: user.id,
            type: 'PURCHASE',
            amount: amountDecimal,
            balanceBefore,
            balanceAfter: newBalance,
            description: description || `Compra en ${new Date().toLocaleString('es-MX')}`,
            cashierId: req.userId,
            paymentMethod: 'CASH',
            reference: clientRef || null
          }
        });

        if (productId) await applyProductSale(tx, productId, transaction.id, req.userId);

        return { transaction, newBalance };
      });
    } catch (txErr) {
      if (txErr.message === 'INSUFFICIENT_BALANCE') {
        return res.status(400).json({ error: 'Saldo insuficiente' });
      }
      if (txErr.message === 'OUT_OF_STOCK') {
        return res.status(400).json({ error: 'Sin existencias de este producto' });
      }
      throw txErr;
    }

    // Email + notificación in-app/push + alerta saldo bajo (no bloquean la respuesta)
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, name: true, minBalance: true }
    });
    if (fullUser) {
      sendPurchaseNotification({
        to: fullUser.email,
        name: fullUser.name,
        productName: description,
        amount: amountDecimal,
        newBalance: result.newBalance
      });

      notifyUser(user.id, {
        type: 'PURCHASE',
        title: 'Cobro en el comedor',
        message: `${description || 'Compra'}: -$${amountDecimal.toFixed(2)}. Saldo: $${result.newBalance.toFixed(2)}`,
        url: '/purchases'
      });

      const threshold = parseFloat(fullUser.minBalance || 0);
      if (threshold > 0 && result.newBalance < threshold) {
        notifyUser(user.id, {
          type: 'LOW_BALANCE',
          title: 'Saldo bajo',
          message: `Saldo bajo: $${result.newBalance.toFixed(2)} (umbral: $${threshold.toFixed(2)})`,
          url: '/recharges'
        });
      }
    }

    res.json({
      success: true,
      transaction: {
        ...result.transaction,
        amount: result.transaction.amount.toString()
      },
      newBalance: result.newBalance.toFixed(2),
      userName: user.name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar pago' });
  }
});

// RECHARGE en sucursal específica
router.post('/branch/:branchId/recharge', async (req, res) => {
  try {
    const { branchId } = req.params;
    if (!(await requireBranchAccess(req, res, branchId))) return;
    const { qrCode, amount, clientRef } = req.body;
    const amountDecimal = parseFloat(amount);

    if (!qrCode || !amountDecimal || amountDecimal <= 0) {
      return res.status(400).json({ error: 'QR y monto válido requeridos' });
    }

    // Idempotencia para sincronización offline
    if (clientRef) {
      const existing = await prisma.transaction.findFirst({ where: { reference: clientRef } });
      if (existing) {
        const u = await prisma.user.findUnique({ where: { id: existing.userId }, select: { name: true, balance: true } });
        return res.json({ success: true, duplicate: true, newBalance: (u?.balance || 0).toString(), userName: u?.name });
      }
    }

    // Buscar por QR o por email
    let user = await prisma.user.findUnique({
      where: { qrCode },
      select: { id: true, balance: true, name: true, isActive: true, branchId: true }
    });

    // Si no encontró por QR, intenta por email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: qrCode },
        select: { id: true, balance: true, name: true, isActive: true, branchId: true }
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.branchId !== branchId) {
      return res.status(403).json({ error: 'Usuario no pertenece a esta sucursal' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // Crédito atómico (increment a nivel de BD) para no perder recargas concurrentes.
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: amountDecimal } }
      });
      const newBalance = parseFloat(updatedUser.balance);
      const balanceBefore = newBalance - amountDecimal;

      const recharge = await tx.recharge.create({
        data: {
          userId: user.id,
          amount: amountDecimal,
          paymentMethod: 'CASH',
          status: 'COMPLETED'
        }
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'RECHARGE',
          amount: amountDecimal,
          balanceBefore,
          balanceAfter: newBalance,
          description: `Recarga en efectivo`,
          cashierId: req.userId,
          paymentMethod: 'CASH',
          status: 'COMPLETED',
          reference: clientRef || null
        }
      });

      return { recharge, newBalance };
    });

    // Email + notificación in-app/push (no bloquean la respuesta)
    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, name: true } });
    if (fullUser) {
      sendRechargeConfirmation({
        to: fullUser.email,
        name: fullUser.name,
        amount: amountDecimal,
        newBalance: result.newBalance,
        method: 'CASH'
      });

      notifyUser(user.id, {
        type: 'RECHARGE',
        title: 'Recarga confirmada',
        message: `Se recargaron $${amountDecimal.toFixed(2)}. Nuevo saldo: $${result.newBalance.toFixed(2)}`,
        url: '/recharges'
      });
    }

    res.json({
      success: true,
      recharge: result.recharge,
      newBalance: result.newBalance.toFixed(2),
      userName: user.name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar recarga' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        cashierId: req.userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const purchases = transactions.filter(t => t.type === 'PURCHASE');
    const recharges = transactions.filter(t => t.type === 'RECHARGE');

    const totalCharges = purchases.length;
    const totalChargesAmount = purchases.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalRecharges = recharges.length;
    const totalRechargesAmount = recharges.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    res.json({
      totalTransactions: transactions.length,
      totalCharges,
      totalChargesAmount: totalChargesAmount.toFixed(2),
      averageCharge: totalCharges > 0 ? (totalChargesAmount / totalCharges).toFixed(2) : '0.00',
      totalRecharges,
      totalRechargesAmount: totalRechargesAmount.toFixed(2),
      date: today.toISOString().split('T')[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

// GET corte de caja detallado del día
router.get('/corte', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const cashier = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true, branchId: true }
    });

    const transactions = await prisma.transaction.findMany({
      where: {
        cashierId: req.userId,
        createdAt: { gte: today, lt: tomorrow }
      },
      include: {
        user: { select: { name: true, employeeNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const charges = transactions.filter(t => t.type === 'PURCHASE');
    const recharges = transactions.filter(t => t.type === 'RECHARGE');

    // Efectivo físico que debería haber en caja: el cambio que se da en cada venta en
    // efectivo ya sale de lo que el comensal pagó, así que lo que se queda en el cajón
    // por cada venta es exactamente su precio (amount) — no hay que restar el cambio aparte.
    const cashSales = charges.filter(t => t.isCashSale);
    const cashSalesAmount = cashSales.reduce((s, t) => s + parseFloat(t.amount), 0);
    const cashRecharges = recharges.filter(t => t.paymentMethod === 'CASH');
    const cashRechargesAmount = cashRecharges.reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalChangeGiven = cashSales.reduce((s, t) => s + parseFloat(t.cashChange || 0), 0);

    // Fondo con el que se abrió la caja hoy (el turno más reciente, abierto o cerrado)
    const lastShift = await prisma.cashierSession.findFirst({
      where: { cashierId: req.userId, branchId: cashier?.branchId, openedAt: { gte: today, lt: tomorrow } },
      orderBy: { openedAt: 'desc' }
    });
    const initialFloat = parseFloat(lastShift?.initialFloat || 0);
    const expectedCashInDrawer = initialFloat + cashSalesAmount + cashRechargesAmount;

    res.json({
      cashierName: cashier?.name || 'Cajero',
      date: today.toISOString(),
      totalCharges: charges.length,
      totalChargesAmount: charges.reduce((s, t) => s + parseFloat(t.amount), 0).toFixed(2),
      totalRecharges: recharges.length,
      totalRechargesAmount: recharges.reduce((s, t) => s + parseFloat(t.amount), 0).toFixed(2),
      cashDrawer: {
        initialFloat: initialFloat.toFixed(2),
        cashSalesCount: cashSales.length,
        cashSalesAmount: cashSalesAmount.toFixed(2),
        cashRechargesCount: cashRecharges.length,
        cashRechargesAmount: cashRechargesAmount.toFixed(2),
        totalChangeGiven: totalChangeGiven.toFixed(2),
        expected: expectedCashInDrawer.toFixed(2)
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toString(),
        balanceBefore: t.balanceBefore?.toString() || '0',
        balanceAfter: t.balanceAfter?.toString() || '0',
        description: t.description,
        createdAt: t.createdAt,
        isCashSale: t.isCashSale,
        cashReceived: t.cashReceived != null ? t.cashReceived.toString() : null,
        cashChange: t.cashChange != null ? t.cashChange.toString() : null,
        user: t.user
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener corte' });
  }
});

// Reporte de subsidio para RH, acotado a ESTA sucursal — para que el cajero también pueda
// sacarlo sin depender de que un admin entre a Admin -> Subsidio.
router.get('/branch/:branchId/subsidy-report', async (req, res) => {
  try {
    const { branchId } = req.params;
    if (!(await requireBranchAccess(req, res, branchId))) return;

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { company: { select: { subsidyIvaRate: true, subsidySettledAt: true } } }
    });
    if (!branch) return res.status(404).json({ error: 'Sucursal no encontrada' });
    const ivaRate = parseFloat(branch.company?.subsidyIvaRate ?? 16);

    const defaultFrom = branch.company?.subsidySettledAt || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const from = req.query.from ? new Date(String(req.query.from)) : defaultFrom;
    from.setHours(0, 0, 0, 0);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    to.setHours(23, 59, 59, 999);

    const users = await prisma.user.findMany({ where: { branchId }, select: { id: true, name: true, employeeNumber: true } });
    const umap = Object.fromEntries(users.map(u => [u.id, u]));

    const txns = await prisma.transaction.findMany({
      where: { isSubsidized: true, userId: { in: users.map(u => u.id) }, createdAt: { gte: from, lte: to } },
      select: { userId: true, amount: true }
    });

    let subtotal = 0;
    const perUser = {};
    for (const t of txns) {
      const amt = parseFloat(t.amount);
      subtotal += amt;
      if (!perUser[t.userId]) perUser[t.userId] = { count: 0, amount: 0 };
      perUser[t.userId].count++;
      perUser[t.userId].amount += amt;
    }
    const iva = subtotal * (ivaRate / 100);
    const total = subtotal + iva;

    const byUser = Object.entries(perUser).map(([uid, v]) => ({
      name: umap[uid]?.name || '—',
      employeeNumber: umap[uid]?.employeeNumber || '',
      count: v.count,
      amount: v.amount.toFixed(2)
    })).sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

    res.json({
      subtotal: subtotal.toFixed(2), iva: iva.toFixed(2), ivaRate: ivaRate.toString(), total: total.toFixed(2),
      count: txns.length, from: from.toISOString(), to: to.toISOString(),
      settledAt: branch.company?.subsidySettledAt || null, byUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          cashierId: req.userId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          user: {
            select: { name: true, employeeNumber: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.transaction.count({
        where: {
          cashierId: req.userId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })
    ]);

    const formatted = transactions.map(t => ({
      ...t,
      amount: t.amount.toString(),
      balanceBefore: t.balanceBefore.toString(),
      balanceAfter: t.balanceAfter.toString(),
      cashReceived: t.cashReceived != null ? t.cashReceived.toString() : null,
      cashChange: t.cashChange != null ? t.cashChange.toString() : null
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
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

export default router;
