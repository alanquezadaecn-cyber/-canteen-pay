import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createMockPrisma } from './mockPrisma.js';
import { makeToken, buildTestApp } from './helpers.js';

const mockPrisma = createMockPrisma();
vi.mock('../src/lib/prisma.js', () => ({ prisma: mockPrisma }));
// Push/email ya se no-opean solos sin VAPID/SMTP configurados en el entorno de pruebas,
// así que no hace falta mockearlos aparte.

const { default: cashierRoutes } = await import('../src/routes/cashier.js');

const CASHIER_ID = 'cashier-1';
const BRANCH_ID = 'branch-1';
const COMENSAL_ID = 'comensal-1';
const COMENSAL_QR = 'qr-comensal-1';
const COMPANY_ID = 'company-1';
const TIER_ID = 'tier-standard';

let app;
let token;

// Configura las respuestas de user.findUnique según el "where" de cada llamada: el
// cajero (requireBranchAccess), el comensal por QR, y el comensal por id (límites,
// notificación, saldo post-cobro). balanceAfter es lo que debe reflejar la consulta
// que ocurre DESPUÉS de decrementar el saldo dentro de la transacción.
function setupUserLookups({ balance = '100', balanceAfter, dailyLimit = 0, subsidyMealsPerDay = null } = {}) {
  mockPrisma.user.findUnique.mockImplementation(async ({ where }) => {
    if (where.id === CASHIER_ID) return { branchId: BRANCH_ID, role: 'CASHIER' };
    if (where.qrCode === COMENSAL_QR) {
      return { id: COMENSAL_ID, balance, name: 'Comensal Test', isActive: true, branchId: BRANCH_ID };
    }
    if (where.id === COMENSAL_ID) {
      return {
        balance: balanceAfter ?? balance,
        dailyLimit, subsidyMealsPerDay,
        email: 'comensal@test.com', name: 'Comensal Test', minBalance: 0
      };
    }
    return null;
  });
}

beforeAll(() => {
  app = buildTestApp('/api/cashier', cashierRoutes);
  token = makeToken({ sub: CASHIER_ID, role: 'CASHIER' });
});

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.transaction.findFirst.mockResolvedValue(null); // sin duplicado por clientRef
});

const charge = (body) =>
  request(app).post(`/api/cashier/branch/${BRANCH_ID}/charge`).set('Authorization', `Bearer ${token}`).send(body);

describe('POST /cashier/branch/:branchId/charge — cobro con saldo (wallet)', () => {
  it('cobra y descuenta el saldo correctamente', async () => {
    setupUserLookups({ balance: '100', balanceAfter: '70' });
    mockPrisma.user.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.transaction.create.mockResolvedValueOnce({ id: 'tx-1', amount: 30 });

    const res = await charge({ qrCode: COMENSAL_QR, amount: 30, description: 'Compra: Torta', clientRef: 'ref-1' });

    expect(res.status).toBe(200);
    expect(res.body.newBalance).toBe('70.00');
  });

  it('rechaza si el saldo no alcanza', async () => {
    setupUserLookups({ balance: '10' });

    const res = await charge({ qrCode: COMENSAL_QR, amount: 30, clientRef: 'ref-2' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/saldo insuficiente/i);
  });

  it('devuelve el resultado guardado si el clientRef ya se procesó (idempotencia)', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValueOnce({ id: 'tx-old', userId: COMENSAL_ID, amount: 30 });
    mockPrisma.user.findUnique.mockImplementation(async ({ where }) => {
      if (where.id === CASHIER_ID) return { branchId: BRANCH_ID, role: 'CASHIER' };
      if (where.id === COMENSAL_ID) return { name: 'Comensal Test', balance: '70' };
      return null;
    });

    const res = await charge({ qrCode: COMENSAL_QR, amount: 30, clientRef: 'ref-dup' });

    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);
  });
});

describe('POST /cashier/branch/:branchId/charge — pago en efectivo directo', () => {
  it('calcula el cambio y no toca el saldo del comensal', async () => {
    setupUserLookups({ balance: '100' });
    mockPrisma.transaction.create.mockResolvedValueOnce({ id: 'tx-2', amount: 30 });

    const res = await charge({ qrCode: COMENSAL_QR, amount: 30, isCashSale: true, cashReceived: 50, clientRef: 'ref-3' });

    expect(res.status).toBe(200);
    expect(res.body.cashSale).toBe(true);
    expect(res.body.change).toBe('20.00');
    expect(res.body.newBalance).toBe('100.00'); // el saldo de la app no se mueve
  });

  it('rechaza si el efectivo recibido no cubre el monto', async () => {
    setupUserLookups({ balance: '100' });

    const res = await charge({ qrCode: COMENSAL_QR, amount: 30, isCashSale: true, cashReceived: 20, clientRef: 'ref-4' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/efectivo recibido/i);
  });
});

describe('POST /cashier/branch/:branchId/charge — cobro subsidiado', () => {
  it('rechaza si no se elige un nivel de subsidio', async () => {
    setupUserLookups({ balance: '100' });
    mockPrisma.branch.findUnique.mockResolvedValueOnce({
      id: BRANCH_ID, company: { id: COMPANY_ID, subsidyEnabled: true, subsidyMealsPerDay: 1 }
    });

    const res = await charge({ qrCode: COMENSAL_QR, amount: 80, subsidized: true, clientRef: 'ref-5' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nivel de subsidio/i);
  });

  it('rechaza un nivel de subsidio que no existe o es de otra empresa', async () => {
    setupUserLookups({ balance: '100' });
    mockPrisma.branch.findUnique.mockResolvedValueOnce({
      id: BRANCH_ID, company: { id: COMPANY_ID, subsidyEnabled: true, subsidyMealsPerDay: 1 }
    });
    mockPrisma.subsidyTier.findUnique.mockResolvedValueOnce({ id: TIER_ID, companyId: 'otra-empresa', isActive: true, cost: 80 });

    const res = await charge({ qrCode: COMENSAL_QR, amount: 80, subsidized: true, subsidyTierId: TIER_ID, clientRef: 'ref-6' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nivel de subsidio inválido/i);
  });

  it('rechaza un nivel asignado a otra sucursal de la misma empresa', async () => {
    setupUserLookups({ balance: '100' });
    mockPrisma.branch.findUnique.mockResolvedValueOnce({
      id: BRANCH_ID, company: { id: COMPANY_ID, subsidyEnabled: true, subsidyMealsPerDay: 1 }
    });
    mockPrisma.subsidyTier.findUnique.mockResolvedValueOnce({ id: TIER_ID, companyId: COMPANY_ID, branchId: 'otra-sucursal', isActive: true, cost: 80 });

    const res = await charge({ qrCode: COMENSAL_QR, amount: 80, subsidized: true, subsidyTierId: TIER_ID, clientRef: 'ref-6b' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no aplica a esta sucursal/i);
  });

  it('acepta un nivel con branchId null (aplica a todas las sucursales)', async () => {
    setupUserLookups({ balance: '100' });
    mockPrisma.branch.findUnique.mockResolvedValueOnce({
      id: BRANCH_ID, company: { id: COMPANY_ID, subsidyEnabled: true, subsidyMealsPerDay: 1 }
    });
    mockPrisma.subsidyTier.findUnique.mockResolvedValueOnce({ id: TIER_ID, name: 'Estándar', companyId: COMPANY_ID, branchId: null, isActive: true, cost: 80 });
    mockPrisma.transaction.count.mockResolvedValueOnce(0);
    mockPrisma.transaction.create.mockResolvedValueOnce({ id: 'tx-6c', amount: 80 });

    const res = await charge({ qrCode: COMENSAL_QR, amount: 80, subsidized: true, subsidyTierId: TIER_ID, clientRef: 'ref-6c' });

    expect(res.status).toBe(200);
  });

  it('cobra el costo del nivel (no el amount recibido) y no descuenta saldo', async () => {
    setupUserLookups({ balance: '100' });
    mockPrisma.branch.findUnique.mockResolvedValueOnce({
      id: BRANCH_ID, company: { id: COMPANY_ID, subsidyEnabled: true, subsidyMealsPerDay: 1 }
    });
    mockPrisma.subsidyTier.findUnique.mockResolvedValueOnce({ id: TIER_ID, name: 'Estándar', companyId: COMPANY_ID, isActive: true, cost: 80 });
    mockPrisma.transaction.count.mockResolvedValueOnce(0); // no ha usado su subsidio hoy
    mockPrisma.transaction.create.mockResolvedValueOnce({ id: 'tx-7', amount: 80 });

    const res = await charge({ qrCode: COMENSAL_QR, amount: 999, subsidized: true, subsidyTierId: TIER_ID, clientRef: 'ref-7' });

    expect(res.status).toBe(200);
    expect(res.body.subsidized).toBe(true);
    expect(res.body.transaction.amount).toBe('80'); // el costo del nivel, no los 999 enviados
    expect(res.body.newBalance).toBe('100.00'); // no se toca
    expect(res.body.subsidyLeft).toBe(0);
  });

  it('rechaza si ya usó sus comidas subsidiadas del día', async () => {
    setupUserLookups({ balance: '100' });
    mockPrisma.branch.findUnique.mockResolvedValueOnce({
      id: BRANCH_ID, company: { id: COMPANY_ID, subsidyEnabled: true, subsidyMealsPerDay: 1 }
    });
    mockPrisma.subsidyTier.findUnique.mockResolvedValueOnce({ id: TIER_ID, name: 'Estándar', companyId: COMPANY_ID, isActive: true, cost: 80 });
    mockPrisma.transaction.count.mockResolvedValueOnce(1); // límite diario ya es 1

    const res = await charge({ qrCode: COMENSAL_QR, amount: 80, subsidized: true, subsidyTierId: TIER_ID, clientRef: 'ref-8' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya usó/i);
  });
});
