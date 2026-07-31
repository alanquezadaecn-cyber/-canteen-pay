import { describe, it, expect, vi, beforeAll } from 'vitest';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { createMockPrisma } from './mockPrisma.js';
import { makeToken, buildTestApp } from './helpers.js';

const mockPrisma = createMockPrisma();
vi.mock('../src/lib/prisma.js', () => ({ prisma: mockPrisma }));

const { default: authRoutes } = await import('../src/routes/auth.js');

let app;
let passwordHash;

beforeAll(async () => {
  app = buildTestApp('/api/auth', authRoutes);
  passwordHash = await bcrypt.hash('Cajasjs3vd', 10);
});

describe('POST /api/auth/verify-password', () => {
  it('rechaza sin token', async () => {
    const res = await request(app).post('/api/auth/verify-password').send({ password: 'x' });
    expect(res.status).toBe(401);
  });

  it('rechaza sin contraseña en el body', async () => {
    const token = makeToken({ sub: 'cashier-1' });
    const res = await request(app).post('/api/auth/verify-password').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });

  it('responde valid:true con la contraseña correcta', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'cashier-1', password: passwordHash });
    const token = makeToken({ sub: 'cashier-1' });
    const res = await request(app).post('/api/auth/verify-password').set('Authorization', `Bearer ${token}`).send({ password: 'Cajasjs3vd' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('responde valid:false con la contraseña incorrecta', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'cashier-1', password: passwordHash });
    const token = makeToken({ sub: 'cashier-1' });
    const res = await request(app).post('/api/auth/verify-password').set('Authorization', `Bearer ${token}`).send({ password: 'incorrecta' });
    expect(res.status).toBe(401);
    expect(res.body.valid).toBe(false);
  });
});
