CREATE TABLE IF NOT EXISTS "RestockRequest" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "quantity" INTEGER,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "requestedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3)
);

DO $$ BEGIN
  ALTER TABLE "RestockRequest" ADD CONSTRAINT "RestockRequest_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "RestockRequest_branchId_idx" ON "RestockRequest"("branchId");
CREATE INDEX IF NOT EXISTS "RestockRequest_productId_idx" ON "RestockRequest"("productId");
CREATE INDEX IF NOT EXISTS "RestockRequest_status_idx" ON "RestockRequest"("status");
