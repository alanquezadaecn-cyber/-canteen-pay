-- El menú rotativo pasa de ser genérico (name/price) a estar ligado a SubsidyTier:
-- cada día del ciclo tiene un platillo distinto POR NIVEL de subsidio.
-- Esto invalida los datos ya sembrados con la forma anterior (se re-siembran después).

-- Limpiar filas existentes de MenuRotationDay (forma vieja, sin subsidyTierId) antes de
-- agregar la columna NOT NULL.
DELETE FROM "MenuRotationDay";

DROP INDEX IF EXISTS "MenuRotationDay_companyId_week_dayOfWeek_key";

ALTER TABLE "MenuRotationDay" DROP COLUMN IF EXISTS "name";
ALTER TABLE "MenuRotationDay" DROP COLUMN IF EXISTS "price";
ALTER TABLE "MenuRotationDay" ADD COLUMN IF NOT EXISTS "subsidyTierId" TEXT NOT NULL;
ALTER TABLE "MenuRotationDay" ADD COLUMN IF NOT EXISTS "dishName" TEXT NOT NULL;

DO $$ BEGIN
  ALTER TABLE "MenuRotationDay" ADD CONSTRAINT "MenuRotationDay_subsidyTierId_fkey"
    FOREIGN KEY ("subsidyTierId") REFERENCES "SubsidyTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "MenuRotationDay_subsidyTierId_idx" ON "MenuRotationDay"("subsidyTierId");
CREATE UNIQUE INDEX IF NOT EXISTS "MenuRotationDay_companyId_week_dayOfWeek_subsidyTierId_key"
  ON "MenuRotationDay"("companyId", "week", "dayOfWeek", "subsidyTierId");

-- Quitar el override manual genérico por sucursal (ahora es por tier, ver BranchManualMenu)
ALTER TABLE "Branch" DROP COLUMN IF EXISTS "manualMenuName";
ALTER TABLE "Branch" DROP COLUMN IF EXISTS "manualMenuPrice";

CREATE TABLE IF NOT EXISTS "BranchManualMenu" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT NOT NULL,
  "subsidyTierId" TEXT NOT NULL,
  "dishName" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "BranchManualMenu" ADD CONSTRAINT "BranchManualMenu_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "BranchManualMenu" ADD CONSTRAINT "BranchManualMenu_subsidyTierId_fkey"
    FOREIGN KEY ("subsidyTierId") REFERENCES "SubsidyTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "BranchManualMenu_branchId_subsidyTierId_key" ON "BranchManualMenu"("branchId", "subsidyTierId");
