import { describe, it, expect, vi } from 'vitest';
import { createMockPrisma } from './mockPrisma.js';

const mockPrisma = createMockPrisma();
vi.mock('../src/lib/prisma.js', () => ({ prisma: mockPrisma }));

const { computeCashDrawer } = await import('../src/routes/cashier-sessions.js');

describe('computeCashDrawer', () => {
  it('suma el fondo inicial + ventas en efectivo + recargas en efectivo (el cambio ya está neteado)', async () => {
    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      { type: 'PURCHASE', amount: '80', isCashSale: true, cashChange: '20', paymentMethod: null },
      { type: 'PURCHASE', amount: '45', isCashSale: true, cashChange: '5', paymentMethod: null },
      { type: 'PURCHASE', amount: '30', isCashSale: false, cashChange: null, paymentMethod: 'CASH' }, // cobro de saldo, no es venta en efectivo
      { type: 'RECHARGE', amount: '200', isCashSale: false, cashChange: null, paymentMethod: 'CASH' },
      { type: 'RECHARGE', amount: '150', isCashSale: false, cashChange: null, paymentMethod: 'STRIPE' } // no es efectivo, no debe contar
    ]);

    const result = await computeCashDrawer('cashier-1', 500, new Date('2026-01-01'), new Date('2026-01-02'));

    expect(result.initialFloat).toBe('500.00');
    expect(result.cashSalesCount).toBe(2);
    expect(result.cashSalesAmount).toBe('125.00'); // 80 + 45, la venta de saldo (isCashSale:false) no cuenta
    expect(result.cashRechargesCount).toBe(1);
    expect(result.cashRechargesAmount).toBe('200.00'); // solo la recarga CASH, no la STRIPE
    expect(result.totalChangeGiven).toBe('25.00'); // 20 + 5, informativo
    expect(result.expected).toBe('825.00'); // 500 + 125 + 200
  });

  it('con caja vacía, lo esperado es exactamente el fondo inicial', async () => {
    mockPrisma.transaction.findMany.mockResolvedValueOnce([]);

    const result = await computeCashDrawer('cashier-1', 300, new Date('2026-01-01'), new Date('2026-01-02'));

    expect(result.expected).toBe('300.00');
    expect(result.cashSalesCount).toBe(0);
    expect(result.cashRechargesCount).toBe(0);
  });

  it('sin fondo inicial (null), lo trata como cero', async () => {
    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      { type: 'PURCHASE', amount: '25', isCashSale: true, cashChange: '0', paymentMethod: null }
    ]);

    const result = await computeCashDrawer('cashier-1', null, new Date('2026-01-01'), new Date('2026-01-02'));

    expect(result.initialFloat).toBe('0.00');
    expect(result.expected).toBe('25.00');
  });
});
