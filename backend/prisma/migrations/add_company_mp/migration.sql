-- Credenciales de MercadoPago por empresa (Opción A: el dinero cae en su cuenta)
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "mpAccessToken" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "mpPublicKey" TEXT;
