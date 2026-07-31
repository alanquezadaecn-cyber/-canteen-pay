ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "subsidySettledAt" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "subsidyIvaRate" DECIMAL(5,2) NOT NULL DEFAULT 16;

CREATE TABLE IF NOT EXISTS "SubsidyTier" (
  "id" TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "cost" DECIMAL(10,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
  ALTER TABLE "SubsidyTier" ADD CONSTRAINT "SubsidyTier_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "SubsidyTier_companyId_idx" ON "SubsidyTier"("companyId");

-- Migrar compañías que ya tenían subsidio activo: crear un nivel "Estándar" con su costo actual
INSERT INTO "SubsidyTier" ("id", "companyId", "name", "cost", "isActive", "createdAt")
SELECT gen_random_uuid()::text, "id", 'Estándar', "subsidyMealCost", true, CURRENT_TIMESTAMP
FROM "Company"
WHERE "subsidyEnabled" = true
AND NOT EXISTS (SELECT 1 FROM "SubsidyTier" WHERE "SubsidyTier"."companyId" = "Company"."id");
