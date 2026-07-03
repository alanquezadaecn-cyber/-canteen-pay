-- Add licensing fields to Branch
ALTER TABLE "Branch" ADD COLUMN "licenseStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Branch" ADD COLUMN "licenseExpiry" TIMESTAMP(3);
ALTER TABLE "Branch" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Branch" ADD COLUMN "blockReason" TEXT;
ALTER TABLE "Branch" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "Branch" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "Branch" ADD COLUMN "monthlyFee" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Branch" ADD COLUMN "lastPaymentDate" TIMESTAMP(3);
ALTER TABLE "Branch" ADD COLUMN "nextPaymentDate" TIMESTAMP(3);

-- CreateTable BranchPayment
CREATE TABLE "BranchPayment" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "paymentDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex BranchPayment
CREATE INDEX "BranchPayment_branchId_idx" ON "BranchPayment"("branchId");

-- AddForeignKey
ALTER TABLE "BranchPayment" ADD CONSTRAINT "BranchPayment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
