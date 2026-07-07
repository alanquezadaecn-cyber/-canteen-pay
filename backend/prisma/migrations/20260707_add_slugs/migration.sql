-- Add slug to Company (unique, default to id temporarily)
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "slug" TEXT;
UPDATE "Company" SET "slug" = "id" WHERE "slug" IS NULL;
ALTER TABLE "Company" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Company_slug_key" ON "Company"("slug");

-- Add slug to Branch (not unique globally, unique per company)
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "slug" TEXT;
UPDATE "Branch" SET "slug" = "id" WHERE "slug" IS NULL;
ALTER TABLE "Branch" ALTER COLUMN "slug" SET NOT NULL;
