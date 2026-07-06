import Stripe from 'stripe';

// Si no hay clave de Stripe, exportamos un objeto stub para no crashear el servidor
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export { stripe };
