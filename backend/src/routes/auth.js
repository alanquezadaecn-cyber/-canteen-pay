import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { QRService } from '../services/qr.service.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import { JWT_SECRET } from '../lib/jwtSecret.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const generateTokens = (userId, role, email, companyId) => {
  const accessToken = jwt.sign(
    { sub: userId, role, email, companyId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { sub: userId, role, email, companyId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branchId, phone } = req.body;

    if (!name || !email || !password || !branchId || !phone) {
      return res.status(400).json({ error: 'Nombre, email, contraseña, sucursal y teléfono son requeridos' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Verificar que la sucursal existe
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { company: true }
    });

    if (!branch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    // Límite de comensales según el plan de la empresa
    const { branchUserLimit } = await import('../lib/limits.js');
    const lim = await branchUserLimit(branchId);
    if (!lim.allowed) {
      return res.status(403).json({ error: 'Este comedor alcanzó su cupo máximo de comensales. Contacta al administrador.' });
    }

    // Auto-generar employeeNumber numérico
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
        employeeNumber: String(nextNum),
        phone,
        qrCode,
        role: 'USER',
        branchId: branchId
      }
    });

    // Email de bienvenida (no bloquea)
    sendWelcomeEmail({ to: email, name, qrCode, employeeNumber: String(nextNum) }).catch(console.error);

    // Usar companyId de la sucursal
    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email, branch.companyId);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: branch.companyId,
        branchId: branch.id,
        companySlug: branch.company?.slug || null,
        branchSlug: branch.slug || null,
        qrCode: user.qrCode,
        employeeNumber: user.employeeNumber,
        balance: '0'
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, branchId } = req.body;
    const identifier = (email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    console.log(`📧 Intento login: ${identifier}${branchId ? ` (Sucursal: ${branchId})` : ''}`);

    let user;
    if (identifier.includes('@')) {
      // Login por email
      user = await prisma.user.findUnique({
        where: { email: identifier.toLowerCase() },
        include: { branch: { include: { company: true } } }
      });
    } else if (branchId) {
      // Login por NÚMERO de empleado dentro de la sucursal
      user = await prisma.user.findFirst({
        where: { employeeNumber: identifier, branchId },
        include: { branch: { include: { company: true } } }
      });
    } else {
      // Sin sucursal, intentar por número de forma global (primer match)
      user = await prisma.user.findFirst({
        where: { employeeNumber: identifier },
        include: { branch: { include: { company: true } } }
      });
    }
    console.log(`👤 Usuario encontrado: ${user ? 'SÍ' : 'NO'}`);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Si se especifica branchId, validar que el usuario pertenece a esa sucursal
    if (branchId && user.branchId !== branchId) {
      console.log(`❌ Usuario no pertenece a la sucursal ${branchId}`);
      return res.status(403).json({ error: 'Usuario no pertenece a esta sucursal' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(`🔐 Password match: ${passwordMatch}`);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const MASTER_EMAIL = process.env.MASTER_EMAIL || 'alejandro.qt92@gmail.com';

    // Bloqueo: si la empresa o la sucursal están bloqueadas, nadie entra (excepto el master
    // admin). Excepción: el ADMIN de la empresa SÍ puede entrar aunque su empresa esté
    // bloqueada — así puede ver el aviso de suspensión y contactar soporte, en vez de
    // quedarse sin poder ni iniciar sesión para saber qué pasó.
    let companyBlocked = false;
    if (user.email !== MASTER_EMAIL) {
      if (user.branch?.company?.isBlocked) {
        if (user.role === 'ADMIN') {
          companyBlocked = true;
        } else {
          return res.status(403).json({ error: 'Cuenta suspendida. Contacta a soporte de CashFood.' });
        }
      }
      if (user.branch?.isBlocked) {
        return res.status(403).json({ error: 'Esta sucursal está suspendida. Contacta a soporte.' });
      }
      if (user.isBlocked) {
        return res.status(403).json({ error: user.blockReason || 'Tu cuenta está bloqueada.' });
      }
    }

    try {
      // Obtener companyId desde branch o desde subdomain
      const companyId = user.branch?.company?.id || req.companyId;

      // El email maestro siempre recibe rol MASTER_ADMIN en el token/respuesta,
      // independientemente del rol almacenado en BD (el enum no tiene MASTER_ADMIN)
      const effectiveRole = user.email === MASTER_EMAIL ? 'MASTER_ADMIN' : user.role;

      const { accessToken, refreshToken } = generateTokens(user.id, effectiveRole, user.email, companyId);

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          company: user.branch?.company?.name || 'N/A',
          role: effectiveRole,
          balance: (user.balance || 0).toString(),
          companyId,
          branchId: user.branchId,
          companySlug: user.branch?.company?.slug || null,
          branchSlug: user.branch?.slug || null,
          qrCode: user.qrCode,
          employeeNumber: user.employeeNumber,
          phone: user.phone,
          companyBlocked
        },
        accessToken,
        refreshToken
      });
    } catch (tokenErr) {
      console.error('❌ Token generation error:', tokenErr);
      res.status(500).json({ error: 'Error generando tokens' });
    }
  } catch (err) {
    console.error('❌ LOGIN ERROR:', err.message || err);
    console.error(err.stack);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.sub, decoded.role, decoded.email, decoded.companyId);

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token inválido' });
  }
});

// Verifica la contraseña del usuario autenticado, sin generar tokens nuevos.
// Se usa para desbloquear el panel de caja tras un bloqueo por inactividad:
// la sesión (tokens) sigue viva todo el tiempo, solo se re-confirma identidad.
router.post('/verify-password', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ valid: false, error: 'Contraseña incorrecta' });

    res.json({ valid: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar contraseña' });
  }
});

export default router;
