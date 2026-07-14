import nodemailer from 'nodemailer';

// Transporter configurado con variables de entorno (Brevo SMTP u otro proveedor)
// Si no hay credenciales configuradas, los envíos fallan silenciosamente
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporter;
}

const FROM = process.env.EMAIL_FROM || 'CashFood <noreply@mealpay.mx>';
const APP_URL = process.env.FRONTEND_URL || 'https://cashfood.online';

async function send(to, subject, html) {
  const t = getTransporter();
  if (!t) return; // Email no configurado, fallo silencioso
  try {
    await t.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error(`[email] Error enviando a ${to}:`, err.message);
  }
}

export async function sendRechargeConfirmation({ to, name, amount, newBalance, method = 'efectivo' }) {
  const methodLabel = method === 'MERCADOPAGO' ? 'MercadoPago' : method === 'STRIPE' ? 'Stripe' : 'efectivo en caja';
  await send(
    to,
    `Recarga de $${parseFloat(amount).toFixed(2)} confirmada — CashFood`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a">Hola ${name},</h2>
      <p style="color:#475569">Tu saldo fue recargado exitosamente.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
        <p style="color:#64748b;font-size:13px;margin:0 0 4px">Monto recargado</p>
        <p style="color:#0f172a;font-size:32px;font-weight:700;margin:0">$${parseFloat(amount).toFixed(2)}</p>
        <p style="color:#64748b;font-size:13px;margin:8px 0 0">Método: ${methodLabel}</p>
      </div>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center">
        <p style="color:#64748b;font-size:13px;margin:0 0 4px">Tu nuevo saldo</p>
        <p style="color:#0f172a;font-size:24px;font-weight:700;margin:0">$${parseFloat(newBalance).toFixed(2)}</p>
      </div>
      <a href="${APP_URL}/dashboard" style="display:block;background:#0f172a;color:#fff;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:600">Ver mi saldo</a>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;text-align:center">CashFood — Sistema de pagos para comedores</p>
    </div>
    `
  );
}

export async function sendWelcomeEmail({ to, name, qrCode, employeeNumber }) {
  await send(
    to,
    `Bienvenido a CashFood — Tu monedero de comedor`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a">¡Bienvenido, ${name}!</h2>
      <p style="color:#475569">Tu cuenta en CashFood ha sido creada. Ya puedes usar tu monedero digital en el comedor.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
        <p style="color:#64748b;font-size:13px;margin:0 0 4px">Tu número de empleado</p>
        <p style="color:#0f172a;font-size:28px;font-weight:700;margin:0;font-family:monospace">#${employeeNumber}</p>
      </div>
      <p style="color:#475569;font-size:14px">Tu código QR: <strong style="font-family:monospace">${String(qrCode).slice(0, 12)}...</strong></p>
      <a href="${APP_URL}/login" style="display:block;background:#6d28d9;color:#fff;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Iniciar sesión</a>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;text-align:center">CashFood — Sistema de pagos para comedores</p>
    </div>
    `
  );
}

export async function sendPurchaseNotification({ to, name, productName, amount, newBalance }) {
  await send(
    to,
    `Cobro de $${parseFloat(amount).toFixed(2)} en el comedor — CashFood`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a">Hola ${name},</h2>
      <p style="color:#475569">Se realizó un cobro en el comedor.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
        <p style="color:#64748b;font-size:13px;margin:0 0 4px">${productName || 'Compra en comedor'}</p>
        <p style="color:#0f172a;font-size:32px;font-weight:700;margin:0">-$${parseFloat(amount).toFixed(2)}</p>
      </div>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center">
        <p style="color:#64748b;font-size:13px;margin:0 0 4px">Saldo restante</p>
        <p style="color:#0f172a;font-size:24px;font-weight:700;margin:0">$${parseFloat(newBalance).toFixed(2)}</p>
      </div>
      <a href="${APP_URL}/purchases" style="display:block;background:#0f172a;color:#fff;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:600">Ver mis compras</a>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;text-align:center">CashFood — Sistema de pagos para comedores</p>
    </div>
    `
  );
}
