import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createMockPrisma } from './mockPrisma.js';
import { makeToken, buildTestApp } from './helpers.js';

const mockPrisma = createMockPrisma();
vi.mock('../src/lib/prisma.js', () => ({ prisma: mockPrisma }));

const { default: cashierRoutes } = await import('../src/routes/cashier.js');

const CASHIER_ID = 'cashier-1';
const BRANCH_ID = 'branch-1';
const COMENSAL_ID = 'comensal-1';
const COMENSAL_QR = 'qr-comensal-1';

let app;
let token;

function setupUserLookups({ balance = '100' } = {}) {
  mockPrisma.user.findUnique.mockImplementation(async ({ where }) => {
    if (where.id === CASHIER_ID) return { branchId: BRANCH_ID, role: 'CASHIER' };
    if (where.qrCode === COMENSAL_QR) return { id: COMENSAL_ID, balance, name: 'Comensal Test', isActive: true, branchId: BRANCH_ID };
    if (where.id === COMENSAL_ID) return { email: 'comensal@test.com', name: 'Comensal Test' };
    return null;
  });
}

beforeAll(() => {
  app = buildTestApp('/api/cashier', cashierRoutes);
  token = makeToken({ sub: CASHIER_ID, role: 'CASHIER' });
});

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.transaction.findFirst.mockResolvedValue(null);
});

const recharge = (body) =>
  request(app).post(`/api/cashier/branch/${BRANCH_ID}/recharge`).set('Authorization', `Bearer ${token}`).send(body);

describe('POST /cashier/branch/:branchId/recharge', () => {
  it('incrementa el saldo del comensal', async () => {
    setupUserLookups({ balance: '100' });
    mockPrisma.user.update.mockResolvedValueOnce({ balance: '150' });
    mockPrisma.recharge.create.mockResolvedValueOnce({ id: 'rc-1' });

    const res = await recharge({ qrCode: COMENSAL_QR, amount: 50, clientRef: 'ref-1' });

    expect(res.status).toBe(200);
    expect(res.body.newBalance).toBe('150.00');
  });

  it('rechaza un monto inválido', async () => {
    setupUserLookups({ balance: '100' });

    const res = await recharge({ qrCode: COMENSAL_QR, amount: 0, clientRef: 'ref-2' });

    expect(res.status).toBe(400);
  });

  it('no vuelve a aplicar una recarga con el mismo clientRef', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValueOnce({ id: 'tx-old', userId: COMENSAL_ID });
    mockPrisma.user.findUnique.mockImplementation(async ({ where }) => {
      if (where.id === CASHIER_ID) return { branchId: BRANCH_ID, role: 'CASHIER' };
      if (where.id === COMENSAL_ID) return { name: 'Comensal Test', balance: '150' };
      return null;
    });

    const res = await recharge({ qrCode: COMENSAL_QR, amount: 50, clientRef: 'ref-dup' });

    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
