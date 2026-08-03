ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "menuRotationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "menuRotationStartDate" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "menuRotationMode" TEXT NOT NULL DEFAULT 'AUTO';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "menuRotationManualWeek" INTEGER;

ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "useMenuRotation" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "MenuRotationDay" (
  "id" TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "week" INTEGER NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "MenuRotationDay" ADD CONSTRAINT "MenuRotationDay_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "MenuRotationDay_companyId_idx" ON "MenuRotationDay"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "MenuRotationDay_companyId_week_dayOfWeek_key" ON "MenuRotationDay"("companyId", "week", "dayOfWeek");
