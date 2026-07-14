import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
// Modo offline de caja: si no hay internet, las operaciones se guardan en una
// cola local (localStorage) y se sincronizan al reconectar. Cada operación lleva
// un clientRef único → el servidor es idempotente y nunca cobra doble.
// ─────────────────────────────────────────────────────────────────────────────

const QUEUE_KEY = 'cashfood_offline_queue';
const cacheKey = (branchId: string) => `cashfood_comensales_${branchId}`;

export interface QueuedOp {
  clientRef: string;
  kind: 'charge' | 'recharge';
  branchId: string;
  qrCode: string;      // identificador usado (qrCode del comensal)
  amount: number;
  description?: string;
  userName: string;
  userId: string;
  ts: number;
}

export const isOnline = () => navigator.onLine;

function uid() {
  return 'off-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// ── Cola ──
export function getQueue(): QueuedOp[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}
function setQueue(q: QueuedOp[]) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
export function queueCount(): number { return getQueue().length; }

// ── Cache de comensales por sucursal (para buscar offline) ──
export function cacheComensales(branchId: string, users: any[]) {
  try { localStorage.setItem(cacheKey(branchId), JSON.stringify({ ts: Date.now(), users })); } catch {}
}
export function getCachedComensales(branchId: string): any[] {
  try { return JSON.parse(localStorage.getItem(cacheKey(branchId)) || '{}').users || []; } catch { return []; }
}
export function findCachedComensal(branchId: string, term: string): any | null {
  const t = term.replace(/^#/, '').trim().toLowerCase();
  const users = getCachedComensales(branchId);
  return users.find((u: any) =>
    u.qrCode === term ||
    (u.email || '').toLowerCase() === t ||
    (u.employeeNumber || '') === t ||
    (u.phone || '') === t ||
    (u.name || '').toLowerCase().includes(t)
  ) || null;
}
function adjustCachedBalance(branchId: string, userId: string, delta: number) {
  const users = getCachedComensales(branchId);
  const u = users.find((x: any) => x.id === userId);
  if (u) { u.balance = (parseFloat(u.balance) + delta).toFixed(2); cacheComensales(branchId, users); }
}

// ── Operar (online con fallback a cola offline) ──
// Devuelve { offline, newBalance } — offline=true si quedó en cola.
export async function doCharge(branchId: string, comensal: any, amount: number, description?: string) {
  const clientRef = uid();
  const payload = { qrCode: comensal.qrCode, amount, description, clientRef };
  if (isOnline()) {
    try {
      const { data } = await api.post(`/cashier/branch/${branchId}/charge`, payload);
      return { offline: false, newBalance: data.newBalance };
    } catch (e: any) {
      // Error de negocio (4xx) → propagar; error de red → encolar
      if (e.response && e.response.status >= 400 && e.response.status < 500) throw e;
    }
  }
  // Offline: encolar y ajustar saldo local
  enqueueOp({ clientRef, kind: 'charge', branchId, qrCode: comensal.qrCode, amount, description, userName: comensal.name, userId: comensal.id, ts: Date.now() });
  adjustCachedBalance(branchId, comensal.id, -amount);
  const newBalance = (parseFloat(comensal.balance) - amount).toFixed(2);
  return { offline: true, newBalance };
}

export async function doRecharge(branchId: string, comensal: any, amount: number) {
  const clientRef = uid();
  const payload = { qrCode: comensal.qrCode, amount, clientRef };
  if (isOnline()) {
    try {
      const { data } = await api.post(`/cashier/branch/${branchId}/recharge`, payload);
      return { offline: false, newBalance: data.newBalance };
    } catch (e: any) {
      if (e.response && e.response.status >= 400 && e.response.status < 500) throw e;
    }
  }
  enqueueOp({ clientRef, kind: 'recharge', branchId, qrCode: comensal.qrCode, amount, userName: comensal.name, userId: comensal.id, ts: Date.now() });
  adjustCachedBalance(branchId, comensal.id, amount);
  const newBalance = (parseFloat(comensal.balance) + amount).toFixed(2);
  return { offline: true, newBalance };
}

function enqueueOp(op: QueuedOp) { const q = getQueue(); q.push(op); setQueue(q); }

// ── Sincronizar la cola con el servidor ──
export async function flushQueue(): Promise<{ synced: number; failed: number; errors: string[] }> {
  let synced = 0, failed = 0;
  const errors: string[] = [];
  const remaining: QueuedOp[] = [];
  for (const op of getQueue()) {
    try {
      const url = `/cashier/branch/${op.branchId}/${op.kind}`;
      await api.post(url, { qrCode: op.qrCode, amount: op.amount, description: op.description, clientRef: op.clientRef });
      synced++;
    } catch (e: any) {
      if (e.response && e.response.status >= 400 && e.response.status < 500) {
        // Error de negocio (saldo insuficiente, etc): no se pudo aplicar → reportar y descartar
        failed++;
        errors.push(`${op.userName} (${op.kind === 'charge' ? 'cobro' : 'recarga'} $${op.amount}): ${e.response.data?.error || 'error'}`);
      } else {
        remaining.push(op); // error de red: reintentar luego
      }
    }
  }
  setQueue(remaining);
  return { synced, failed, errors };
}
