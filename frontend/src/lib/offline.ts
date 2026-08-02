import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
// Modo offline de caja: si no hay internet, las operaciones se guardan en una
// cola local (localStorage) y se sincronizan al reconectar. Cada operación lleva
// un clientRef único → el servidor es idempotente y nunca cobra doble.
// ─────────────────────────────────────────────────────────────────────────────

const QUEUE_KEY = 'cashfood_offline_queue';
const cacheKey = (branchId: string) => `cashfood_comensales_${branchId}`;
const productsCacheKey = (branchId: string) => `cashfood_products_${branchId}`;
const attendanceCacheKey = (branchId: string) => `cashfood_attendance_${branchId}`;

export interface QueuedOp {
  clientRef: string;
  kind: 'charge' | 'recharge' | 'attendance';
  branchId: string;
  qrCode: string;      // identificador usado (qrCode del comensal, o término de asistencia)
  amount?: number;
  description?: string;
  productId?: string;  // producto cobrado (para descontar stock de snacks al sincronizar)
  subsidized?: boolean;
  subsidyTierId?: string;
  attendanceType?: 'IN' | 'OUT'; // solo kind:'attendance' — el tipo que se calculó localmente
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

// Guarda/actualiza el snapshot de subsidio de UN comensal (tiers, límite, usadas hoy) en su
// registro cacheado. Se llama cada vez que se escanea con conexión, para que si justo
// después se pierde la señal, el offline sepa cuántas comidas subsidiadas le quedan hoy.
export function cacheComensalSubsidy(branchId: string, userId: string, subsidy: any) {
  const users = getCachedComensales(branchId);
  const u = users.find((x: any) => x.id === userId);
  if (u) { u.subsidy = subsidy; cacheComensales(branchId, users); }
}
// Descuenta una comida subsidiada del contador local (tras encolar un cobro subsidiado
// offline), para que el mismo cajero no pueda subsidiar de más al mismo comensal dos
// veces en la misma sesión sin conexión.
function adjustCachedSubsidy(branchId: string, userId: string) {
  const users = getCachedComensales(branchId);
  const u = users.find((x: any) => x.id === userId);
  if (u?.subsidy) {
    u.subsidy.usedToday = (u.subsidy.usedToday || 0) + 1;
    u.subsidy.left = Math.max(0, (u.subsidy.left || 0) - 1);
    cacheComensales(branchId, users);
  }
}

// ── Cache del menú/snacks por sucursal (para poder cobrar offline: sin esto, al perder
// conexión el menú se veía vacío y ni siquiera un cobro con saldo se podía hacer) ──
export function cacheProducts(branchId: string, products: any[]) {
  try { localStorage.setItem(productsCacheKey(branchId), JSON.stringify({ ts: Date.now(), products })); } catch {}
}
export function getCachedProducts(branchId: string): any[] {
  try { return JSON.parse(localStorage.getItem(productsCacheKey(branchId)) || '{}').products || []; } catch { return []; }
}

// ── Operar (online con fallback a cola offline) ──
// Devuelve { offline, newBalance } — offline=true si quedó en cola.
export async function doCharge(branchId: string, comensal: any, amount: number, description?: string, subsidized = false, productId?: string, subsidyTierId?: string) {
  const clientRef = uid();
  const payload: any = { qrCode: comensal.qrCode, amount, description, clientRef, subsidized, productId, subsidyTierId };
  if (subsidized) {
    if (isOnline()) {
      try {
        const { data } = await api.post(`/cashier/branch/${branchId}/charge`, payload);
        return { offline: false, subsidized: true, newBalance: data.newBalance, subsidyLeft: data.subsidyLeft };
      } catch (e: any) {
        if (e.response && e.response.status >= 400 && e.response.status < 500) throw e;
      }
    }
    // Sin conexión: se valida con el último límite que se conocía de este comensal (de la
    // última vez que se escaneó con señal) — el cajero ya vio "cuántas le quedan hoy" en
    // pantalla antes de cobrar, así que el riesgo es solo si el mismo comensal ya la usó
    // en OTRA sucursal/turno mientras no había señal aquí.
    enqueueOp({ clientRef, kind: 'charge', branchId, qrCode: comensal.qrCode, amount, description, subsidized: true, subsidyTierId, userName: comensal.name, userId: comensal.id, ts: Date.now() });
    adjustCachedSubsidy(branchId, comensal.id);
    const subsidyLeft = Math.max(0, (comensal.subsidy?.left ?? 1) - 1);
    return { offline: true, subsidized: true, newBalance: parseFloat(comensal.balance).toFixed(2), subsidyLeft };
  }
  if (isOnline()) {
    try {
      const { data } = await api.post(`/cashier/branch/${branchId}/charge`, payload);
      return { offline: false, newBalance: data.newBalance };
    } catch (e: any) {
      // Error de negocio (4xx) → propagar; error de red → encolar
      if (e.response && e.response.status >= 400 && e.response.status < 500) throw e;
    }
  }
  // Offline: encolar y ajustar saldo local (el stock del snack se descuenta al sincronizar)
  enqueueOp({ clientRef, kind: 'charge', branchId, qrCode: comensal.qrCode, amount, description, productId, userName: comensal.name, userId: comensal.id, ts: Date.now() });
  adjustCachedBalance(branchId, comensal.id, -amount);
  const newBalance = (parseFloat(comensal.balance) - amount).toFixed(2);
  return { offline: true, newBalance };
}

// Pago en efectivo directo: el comensal paga en mano, no se toca su saldo de la app.
// Siempre requiere conexión (se registra en el servidor con el cambio dado, para el corte).
export async function doCashSale(branchId: string, comensal: any, amount: number, cashReceived: number, description?: string, productId?: string) {
  const clientRef = uid();
  const payload = { qrCode: comensal.qrCode, amount, description, clientRef, isCashSale: true, cashReceived, productId };
  const { data } = await api.post(`/cashier/branch/${branchId}/charge`, payload);
  return { newBalance: data.newBalance, change: data.change };
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

// ── Cache de asistencia por sucursal (para que la lista no se vea vacía sin conexión, y
// para poder calcular localmente si toca ENTRADA o SALIDA al marcar offline) ──
function todayStr() { return new Date().toISOString().slice(0, 10); }
export function cacheAttendanceRecords(branchId: string, records: any[]) {
  try { localStorage.setItem(attendanceCacheKey(branchId), JSON.stringify({ date: todayStr(), records })); } catch {}
}
export function getCachedAttendanceRecords(branchId: string): any[] {
  try {
    const data = JSON.parse(localStorage.getItem(attendanceCacheKey(branchId)) || '{}');
    return data.date === todayStr() ? (data.records || []) : []; // no arrastrar registros de otro día
  } catch { return []; }
}

// Resuelve una persona para asistencia offline. Solo cubre comensales (los que ya se
// cachearon al cobrar/recargar) — el personal de operación (cajeros/admin) sigue
// requiriendo conexión para marcar asistencia.
export function resolveAttendancePerson(branchId: string, term: string): any | null {
  return findCachedComensal(branchId, term);
}

// Calcula ENTRADA/SALIDA localmente: mira el último registro de HOY para esa persona,
// tanto en el cache del servidor como en la cola offline aún no sincronizada (para que
// dos marcajes seguidos sin conexión alternen bien entre entrada y salida).
function lastAttendanceType(branchId: string, personId: string): 'IN' | 'OUT' | null {
  const queued = getQueue().filter(o => o.kind === 'attendance' && o.branchId === branchId && o.userId === personId);
  if (queued.length > 0) return queued[queued.length - 1].attendanceType || null;
  const cached = getCachedAttendanceRecords(branchId).filter((r: any) => r.user?.id === personId || r.userId === personId);
  return cached.length > 0 ? cached[0].type : null; // los registros vienen orden desc (más reciente primero)
}

export function queueAttendance(branchId: string, person: any) {
  const type: 'IN' | 'OUT' = lastAttendanceType(branchId, person.id) === 'IN' ? 'OUT' : 'IN';
  const clientRef = uid();
  enqueueOp({
    clientRef, kind: 'attendance', branchId, qrCode: person.qrCode || person.employeeNumber,
    attendanceType: type, userName: person.name, userId: person.id, ts: Date.now()
  });
  // Reflejar de inmediato en el cache local para que la lista de "hoy" no se vea vacía
  // y para que el siguiente marcaje (si es el mismo día) calcule bien entrada/salida.
  const records = getCachedAttendanceRecords(branchId);
  records.unshift({
    id: clientRef, type, createdAt: new Date().toISOString(),
    user: { name: person.name, position: person.position, employeeNumber: person.employeeNumber, isStaff: false }
  });
  cacheAttendanceRecords(branchId, records);
  return { type, time: new Date().toISOString(), name: person.name, position: person.position || '' };
}

// ── Sincronizar la cola con el servidor ──
export async function flushQueue(): Promise<{ synced: number; failed: number; errors: string[] }> {
  let synced = 0, failed = 0;
  const errors: string[] = [];
  const remaining: QueuedOp[] = [];
  for (const op of getQueue()) {
    try {
      if (op.kind === 'attendance') {
        await api.post(`/cashier/branch/${op.branchId}/attendance/scan`, { qrCode: op.qrCode });
      } else {
        const url = `/cashier/branch/${op.branchId}/${op.kind}`;
        await api.post(url, {
          qrCode: op.qrCode, amount: op.amount, description: op.description, clientRef: op.clientRef,
          productId: op.productId, subsidized: op.subsidized, subsidyTierId: op.subsidyTierId
        });
      }
      synced++;
    } catch (e: any) {
      if (e.response && e.response.status >= 400 && e.response.status < 500) {
        // Error de negocio (saldo insuficiente, límite de subsidio ya usado, etc): no se
        // pudo aplicar → reportar y descartar (no tiene sentido reintentar lo mismo).
        failed++;
        const label = op.kind === 'charge' ? 'cobro' : op.kind === 'recharge' ? 'recarga' : 'asistencia';
        errors.push(`${op.userName} (${label}${op.amount ? ` $${op.amount}` : ''}): ${e.response.data?.error || 'error'}`);
      } else {
        remaining.push(op); // error de red: reintentar luego
      }
    }
  }
  setQueue(remaining);
  return { synced, failed, errors };
}
