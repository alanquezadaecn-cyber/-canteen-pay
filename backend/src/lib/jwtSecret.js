// Fuente única del secreto JWT. En producción es obligatorio venir de env var:
// un secreto hardcodeado en el código permitiría forjar tokens (incluso de master admin)
// a cualquiera que vea el repo.
const FALLBACK_DEV_SECRET = 'canteen-pay-dev-only-secret';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está configurado. Es obligatorio en producción (railway variables set JWT_SECRET=...)');
}

export const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_DEV_SECRET;
