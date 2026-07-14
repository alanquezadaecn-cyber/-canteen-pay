// @ts-ignore — qz-tray no incluye tipos TypeScript
import qz from 'qz-tray';
import type { TicketData } from './printTicket';

/* ── ESC/POS constants ───────────────────────────────────────── */
const ESC = '\x1B';
const GS  = '\x1D';

const CMD = {
  INIT:           ESC + '\x40',
  CUT:            GS  + '\x56\x42\x00', // full cut + feed
  LEFT:           ESC + '\x61\x00',
  CENTER:         ESC + '\x61\x01',
  BOLD_ON:        ESC + '\x45\x01',
  BOLD_OFF:       ESC + '\x45\x00',
  SIZE_NORMAL:    ESC + '\x21\x00',
  SIZE_TALL:      ESC + '\x21\x10', // double height
  SIZE_LARGE:     ESC + '\x21\x30', // double height + width
};

const W = 48; // chars wide at normal size (80mm / ~1.67mm per char)

const pad = (s: string, w: number, align: 'l' | 'r' | 'c' = 'l') => {
  const str = String(s).slice(0, w);
  const sp  = w - str.length;
  if (align === 'r') return ' '.repeat(sp) + str;
  if (align === 'c') return ' '.repeat(Math.floor(sp / 2)) + str + ' '.repeat(Math.ceil(sp / 2));
  return str + ' '.repeat(sp);
};

const row = (label: string, value: string) =>
  pad(label, 22) + pad(value, W - 22, 'r') + '\n';

const div = (c = '-') => c.repeat(W) + '\n';

const fmtMoney = (n: string | number) =>
  `$${parseFloat(String(n)).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d?: string | Date) =>
  (d ? new Date(d) : new Date()).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const TYPE_LABEL: Record<TicketData['type'], string> = {
  PURCHASE: 'COMPRA',
  RECHARGE: 'RECARGA DE SALDO',
  REFUND:   'REEMBOLSO',
};

function buildESCPOS(data: TicketData): string {
  const sign     = data.type === 'PURCHASE' ? '-' : '+';
  const amountFmt = sign + fmtMoney(data.amount);
  const shortId  = data.transactionId
    ? data.transactionId.slice(-8).toUpperCase()
    : Math.random().toString(36).slice(2, 10).toUpperCase();
  const typeLabel = `[ ${TYPE_LABEL[data.type]} ]`;

  return [
    CMD.INIT,

    // ── Logo / nombre ──────────────────────────────
    CMD.CENTER,
    CMD.SIZE_LARGE, CMD.BOLD_ON, 'MEALPAY\n', CMD.BOLD_OFF,
    CMD.SIZE_NORMAL, 'Sistema de Comedor Digital\n',

    div('='),

    // ── Tipo ───────────────────────────────────────
    CMD.BOLD_ON,
    pad(typeLabel, W, 'c') + '\n',
    CMD.BOLD_OFF,

    div('='),

    // ── Folio y fecha ──────────────────────────────
    CMD.LEFT,
    row('Fecha:', fmtDate(data.date)),
    row('Folio:', '#' + shortId),

    div(),

    // ── Usuario ────────────────────────────────────
    row('Usuario:', data.userName),
    row('Empleado:', '#' + data.employeeNumber),

    div('='),

    // ── Monto grande ───────────────────────────────
    CMD.CENTER,
    CMD.SIZE_NORMAL, 'MONTO\n',
    CMD.SIZE_LARGE, CMD.BOLD_ON, amountFmt + '\n', CMD.BOLD_OFF,
    CMD.SIZE_NORMAL,

    div('='),

    // ── Saldos ─────────────────────────────────────
    CMD.LEFT,
    row('Saldo anterior:', fmtMoney(data.balanceBefore)),
    CMD.BOLD_ON,
    row('Saldo actual:', fmtMoney(data.balanceAfter)),
    CMD.BOLD_OFF,

    ...(data.description ? [div(), data.description.slice(0, W) + '\n'] : []),

    div('='),

    // ── Pie ────────────────────────────────────────
    CMD.CENTER,
    '\n',
    '* Gracias por usar CashFood *\n',
    'Conserve este comprobante\n',
    '\n\n\n',

    CMD.CUT,
  ].join('');
}

/* ── QZ Tray connection ──────────────────────────────────────── */

let connected = false;

function setupSecurity() {
  // Modo sin firma — QZ Tray debe tener "Allow unsigned" activado en sus ajustes
  qz.security.setCertificatePromise((resolve: Function) => resolve(null));
  qz.security.setSignatureAlgorithm('SHA512');
  qz.security.setSignaturePromise(() => (resolve: Function) => resolve(null));
}

async function ensureConnected(): Promise<void> {
  if (qz.websocket.isActive()) return;
  setupSecurity();
  await qz.websocket.connect({ retries: 2, delay: 500 });
  connected = true;
}

/**
 * Intenta imprimir usando QZ Tray.
 * Devuelve `true` si tuvo éxito, `false` si QZ Tray no está disponible.
 */
export async function printViaQZ(data: TicketData): Promise<boolean> {
  try {
    await ensureConnected();

    const printer = await qz.printers.getDefault();
    if (!printer) throw new Error('No hay impresora predeterminada');

    const config = qz.configs.create(printer);
    await qz.print(config, [
      { type: 'raw', format: 'plain', data: buildESCPOS(data) }
    ]);

    return true;
  } catch (err) {
    connected = false;
    console.warn('[QZ Tray] No disponible, usando ventana de impresión:', err);
    return false;
  }
}

/** Desconectar cuando el usuario cierre sesión (opcional) */
export function disconnectQZ() {
  if (qz.websocket.isActive()) {
    qz.websocket.disconnect().catch(() => {});
  }
  connected = false;
}
