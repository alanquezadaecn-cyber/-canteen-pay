ALTER TABLE "SubsidyTier" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

DO $$ BEGIN
  ALTER TABLE "SubsidyTier" ADD CONSTRAINT "SubsidyTier_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "SubsidyTier_branchId_idx" ON "SubsidyTier"("branchId");
