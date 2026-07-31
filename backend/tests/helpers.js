import jwt from 'jsonwebtoken';
import express from 'express';
import { JWT_SECRET } from '../src/lib/jwtSecret.js';

export function makeToken({ sub = 'user-1', role = 'CASHIER', email = 'cashier@test.com', companyId = 'company-1' } = {}) {
  return jwt.sign({ sub, role, email, companyId }, JWT_SECRET, { expiresIn: '1h' });
}

// App mínima que monta solo el router bajo prueba, igual que app.js pero sin el resto
// de la aplicación (ni app.listen) para no arrancar un servidor real en las pruebas.
export function buildTestApp(mountPath, router) {
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  return app;
}
