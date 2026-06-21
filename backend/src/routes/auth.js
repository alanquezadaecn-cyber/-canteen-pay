import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { QRService } from '../services/qr.service.js';

const router = express.Router();

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company, employeeNumber, phone } = req.body;

    if (!name || !email || !password || !company || !employeeNumber || !phone) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const qrCode = QRService.generateUniqueCode();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        company,
        employeeNumber,
        phone,
        qrCode,
        role: 'USER' // Siempre USER en registro público
      }
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        balance: user.balance.toString()
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.sub, decoded.role);

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token inválido' });
  }
});

export default router;
