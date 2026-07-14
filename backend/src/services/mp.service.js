import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

// Cliente por defecto (plataforma) — usado solo si una empresa no configuró el suyo
const defaultClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || ''
});

const preference = new Preference(defaultClient);
const payment = new Payment(defaultClient);

// Cliente con el token de una EMPRESA específica (el dinero cae en su cuenta)
export function mpForCompany(accessToken) {
  const client = new MercadoPagoConfig({ accessToken });
  return {
    preference: new Preference(client),
    payment: new Payment(client)
  };
}

export { preference, payment };
