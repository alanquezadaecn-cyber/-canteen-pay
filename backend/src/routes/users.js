import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import { QRService } from '../services/qr.service.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        employeeNumber: true,
        phone: true,
        role: true,
        balance: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ ...user, balance: user.balance.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

router.put('/me', verifyToken, async (req, res) => {
  try {
    const { name, phone, company } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(company && { company })
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        employeeNumber: true,
        phone: true,
        role: true,
        balance: true
      }
    });

    res.json({ ...user, balance: user.balance.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

router.put('/me/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseñas requeridas' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

router.get('/me/qr', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { qrCode: true, name: true, employeeNumber: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const qrImage = await QRService.generateQRImage(user.qrCode);

    res.json({
      qrCode: user.qrCode,
      qrImage,
      name: user.name,
      employeeNumber: user.employeeNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar código QR' });
  }
});

export default router;
