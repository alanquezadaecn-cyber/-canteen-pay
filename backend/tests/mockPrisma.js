import { vi } from 'vitest';

// Mock de Prisma para pruebas: cualquier prisma.<modelo>.<metodo>(...) que se toque se
// crea solo, como vi.fn() que resuelve undefined por defecto. Cada prueba sobreescribe
// solo lo que necesita con mockImplementation/mockResolvedValueOnce. $transaction ejecuta
// el callback pasándole el mismo mock (nuestras rutas usan los mismos modelos en tx que
// fuera de tx, así que no hace falta un mock de transacción aparte).
export function createMockPrisma() {
  const root = {};
  root.$transaction = vi.fn(async (arg) => {
    if (typeof arg === 'function') return arg(proxy);
    return Promise.all(arg);
  });
  root.$queryRaw = vi.fn().mockResolvedValue([]);

  const proxy = new Proxy(root, {
    get(target, prop) {
      if (prop in target) return target[prop];
      const modelTarget = {};
      target[prop] = new Proxy(modelTarget, {
        get(mTarget, method) {
          if (!(method in mTarget)) {
            mTarget[method] = vi.fn().mockResolvedValue(undefined);
          }
          return mTarget[method];
        }
      });
      return target[prop];
    }
  });

  return proxy;
}
