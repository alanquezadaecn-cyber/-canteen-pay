import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';
import { vapidPublicKey } from '../lib/push.js';

const router = express.Router();

// Llave pública VAPID: el frontend la necesita para pedir permiso de notificaciones
// (no requiere auth, es información pública por diseño del protocolo Web Push)
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

router.use(verifyToken);

// Guarda/actualiza la suscripción push de este dispositivo para el usuario autenticado
router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Suscripción inválida' });
    }
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: req.userId, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar suscripción' });
  }
});

// Elimina la suscripción de este dispositivo (el usuario desactivó las notificaciones)
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.userId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar suscripción' });
  }
});

export default router;
