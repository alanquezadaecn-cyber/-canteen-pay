-- CreateTable Plan
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "maxBranches" INTEGER NOT NULL DEFAULT 1,
    "maxUsersPerBranch" INTEGER,
    "features" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable Subscription
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "renewalDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable Company
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "industry" TEXT,
    "subscriptionId" TEXT,
    "contactPerson" TEXT,
    "paymentEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "masterAdminEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompanyPayment
CREATE TABLE "CompanyPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "invoiceNumber" TEXT,
    "paymentDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyPayment_pkey" PRIMARY KEY ("id")
);

-- Add companyId to Branch
ALTER TABLE "Branch" ADD COLUMN "companyId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
CREATE UNIQUE INDEX "Subscription_id_key" ON "Subscription"("id");
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");
CREATE UNIQUE INDEX "Company_subscriptionId_key" ON "Company"("subscriptionId");
CREATE INDEX "Company_subscriptionId_idx" ON "Company"("subscriptionId");
CREATE INDEX "CompanyPayment_companyId_idx" ON "CompanyPayment"("companyId");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- Insert default Plan
INSERT INTO "Plan" ("id", "name", "description", "price", "billingCycle", "maxBranches", "features", "createdAt", "updatedAt")
VALUES (
    'default-plan-free',
    'ENTERPRISE',
    'Plan empresarial - hasta 10 sucursales',
    0,
    'ONETIME',
    10,
    ARRAY['qr-payments', 'cashier-module', 'admin-panel', 'reports'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Insert default Company for existing branches
INSERT INTO "Company" ("id", "name", "email", "phone", "industry", "isActive", "createdAt", "updatedAt")
VALUES (
    'default-company-legacy',
    'Empresa Legado',
    'legacy@mealpay.com',
    NULL,
    'Múltiple',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Update existing branches to point to default company
UPDATE "Branch" SET "companyId" = 'default-company-legacy' WHERE "companyId" IS NULL;

-- Make companyId NOT NULL
ALTER TABLE "Branch" ALTER COLUMN "companyId" SET NOT NULL;

-- AddForeignKey for Subscription
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for Company
ALTER TABLE "Company" ADD CONSTRAINT "Company_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for CompanyPayment
ALTER TABLE "CompanyPayment" ADD CONSTRAINT "CompanyPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for Branch
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
