import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { sendRechargeConfirmation, sendPurchaseNotification } from '../services/email.service.js';
import { assertBranchHasRoom, branchUserLimit } from '../lib/limits.js';

const router = express.Router();

router.use(verifyToken, checkRole(['CASHIER', 'ADMIN']));

// GET branch info for cashier
router.get('/branch/:branchId', async (req, res) => {
  try {
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

    res.json({
      ...user,
      balance: user.balance.toString()
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
    const { name, email, phone, password, employeeNumber } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Validar que el cajero pertenece a esa sucursal (admin puede en cualquiera de su empresa)
    const cashier = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { branchId: true, role: true }
    });
    if (cashier?.role === 'CASHIER' && cashier.branchId !== branchId) {
      return res.status(403).json({ error: 'No puedes registrar en otra sucursal' });
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) return res.status(404).json({ error: 'Sucursal no encontrada' });

    // Límite de comensales según el plan
    if (!(await assertBranchHasRoom(branchId, res))) return;

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

    const plainPassword = password?.trim() || empNum; // default: su número de empleado
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
        isActive: true
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
        password: plainPassword
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
    const { search } = req.query;

    const cashier = await prisma.user.findUnique({
      where: { id: req.userId }, select: { branchId: true, role: true }
    });
    if (cashier?.role === 'CASHIER' && cashier.branchId !== branchId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const where = {
      branchId,
      role: 'USER',
      ...(search ? {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } },
          { employeeNumber: { contains: String(search) } }
        ]
      } : {})
    };

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, employeeNumber: true, phone: true, balance: true, qrCode: true, isActive: true },
      orderBy: { name: 'asc' },
      take: 100
    });

    res.json(users.map(u => ({ ...u, balance: u.balance.toString() })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener comensales' });
  }
});

// LÍMITE de comensales de la sucursal (uso vs máximo del plan)
router.get('/branch/:branchId/limit', async (req, res) => {
  try {
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

    const cashier = await prisma.user.findUnique({
      where: { id: req.userId }, select: { branchId: true, role: true }
    });
    if (cashier?.role === 'CASHIER' && cashier.branchId !== branchId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

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
    const { qrCode, amount, description, clientRef } = req.body;
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

    const result = await prisma.$transaction(async (tx) => {
      const balanceBefore = parseFloat(user.balance);
      const newBalance = balanceBefore - amountDecimal;

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: newBalance }
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount: amountDecimal,
          balanceBefore: balanceBefore,
          balanceAfter: newBalance,
          description: description || `Compra en ${new Date().toLocaleString('es-MX')}`,
          cashierId: req.userId,
          paymentMethod: 'CASH',
          reference: clientRef || null
        }
      });

      return { transaction, newBalance };
    });

    // Email + alerta saldo bajo (no bloquean la respuesta)
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

      const threshold = parseFloat(fullUser.minBalance || 0);
      if (threshold > 0 && result.newBalance < threshold) {
        prisma.userAlert.create({
          data: {
            userId: user.id,
            type: 'LOW_BALANCE',
            message: `Saldo bajo: $${result.newBalance.toFixed(2)} (umbral: $${threshold.toFixed(2)})`
          }
        }).catch(console.error);
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

    const result = await prisma.$transaction(async (tx) => {
      const balanceBefore = parseFloat(user.balance);
      const newBalance = balanceBefore + amountDecimal;

      await tx.user.update({
        where: { id: user.id },
        data: { balance: newBalance }
      });

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

    // Email de notificación (no bloquea la respuesta)
    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, name: true } });
    if (fullUser) {
      sendRechargeConfirmation({
        to: fullUser.email,
        name: fullUser.name,
        amount: amountDecimal,
        newBalance: result.newBalance,
        method: 'CASH'
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

// Endpoints legados (sin filtro por sucursal)
router.get('/scan/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;

    const user = await prisma.user.findUnique({
      where: { qrCode },
      select: {
        id: true,
        name: true,
        email: true,
        branchId: true,
        employeeNumber: true,
        phone: true,
        balance: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    res.json({
      ...user,
      balance: user.balance.toString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al escanear QR' });
  }
});

router.post('/charge', async (req, res) => {
  try {
    const { qrCode, amount, description } = req.body;
    const amountDecimal = parseFloat(amount);

    if (!qrCode || !amountDecimal || amountDecimal <= 0) {
      return res.status(400).json({ error: 'QR y monto válido requeridos' });
    }

    const user = await prisma.user.findUnique({
      where: { qrCode },
      select: { id: true, balance: true, name: true, isActive: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    const balanceDecimal = parseFloat(user.balance);
    if (balanceDecimal < amountDecimal) {
      return res.status(400).json({
        error: 'Saldo insuficiente',
        currentBalance: balanceDecimal.toFixed(2),
        required: amountDecimal.toFixed(2)
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const balanceBefore = parseFloat(user.balance);
      const newBalance = balanceBefore - amountDecimal;

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
        select: { balance: true }
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount: amountDecimal,
          balanceBefore: balanceBefore,
          balanceAfter: newBalance,
          description: description || `Compra en comedor - ${new Date().toLocaleString('es-MX')}`,
          cashierId: req.userId,
          paymentMethod: 'CASH'
        }
      });

      return { transaction, newBalance };
    });

    res.json({
      success: true,
      transaction: {
        ...result.transaction,
        amount: result.transaction.amount.toString(),
        balanceBefore: result.transaction.balanceBefore.toString(),
        balanceAfter: result.transaction.balanceAfter.toString()
      },
      newBalance: result.newBalance.toFixed(2),
      userName: user.name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar pago' });
  }
});

router.post('/recharge', async (req, res) => {
  try {
    const { qrCode, amount } = req.body;
    const amountDecimal = parseFloat(amount);

    if (!qrCode || !amountDecimal || amountDecimal <= 0) {
      return res.status(400).json({ error: 'QR y monto válido requeridos' });
    }

    const user = await prisma.user.findUnique({
      where: { qrCode },
      select: { id: true, balance: true, name: true, isActive: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const balanceBefore = parseFloat(user.balance);
      const newBalance = balanceBefore + amountDecimal;

      await tx.user.update({
        where: { id: user.id },
        data: { balance: newBalance }
      });

      const recharge = await tx.recharge.create({
        data: {
          userId: user.id,
          amount: amountDecimal,
          paymentMethod: 'CASH',
          status: 'COMPLETED',
          reference: `CASH-${Date.now()}`
        }
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'RECHARGE',
          amount: amountDecimal,
          balanceBefore: balanceBefore,
          balanceAfter: newBalance,
          description: `Recarga en efectivo - ${new Date().toLocaleString('es-MX')}`,
          cashierId: req.userId,
          paymentMethod: 'CASH',
          reference: recharge.id
        }
      });

      return { recharge, newBalance };
    });

    res.json({
      success: true,
      recharge: {
        ...result.recharge,
        amount: result.recharge.amount.toString()
      },
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

    res.json({
      cashierName: cashier?.name || 'Cajero',
      date: today.toISOString(),
      totalCharges: charges.length,
      totalChargesAmount: charges.reduce((s, t) => s + parseFloat(t.amount), 0).toFixed(2),
      totalRecharges: recharges.length,
      totalRechargesAmount: recharges.reduce((s, t) => s + parseFloat(t.amount), 0).toFixed(2),
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toString(),
        balanceBefore: t.balanceBefore?.toString() || '0',
        balanceAfter: t.balanceAfter?.toString() || '0',
        description: t.description,
        createdAt: t.createdAt,
        user: t.user
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener corte' });
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
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

export default router;
