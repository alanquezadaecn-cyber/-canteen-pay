import webpush from 'web-push';
import { prisma } from './prisma.js';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:soporte@cashfood.online';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

export const vapidPublicKey = VAPID_PUBLIC || null;

// Envía una notificación push a todos los dispositivos suscritos de un usuario.
// No lanza error si falla (nunca debe tumbar el cobro/recarga que la dispara);
// borra suscripciones que el navegador ya invalidó (410/404).
export async function sendPushToUser(userId, { title, body, url }) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return; // Push no configurado
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) return;

    const payload = JSON.stringify({ title, body, url: url || '/' });
    await Promise.all(subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error('[push] Error enviando:', err.message);
        }
      }
    }));
  } catch (err) {
    console.error('[push] Error general:', err.message);
  }
}
