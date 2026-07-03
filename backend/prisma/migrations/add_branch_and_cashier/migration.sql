-- CreateTable Branch
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable Cashier
CREATE TABLE "Cashier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "branchId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cashier_pkey" PRIMARY KEY ("id")
);

-- AddColumn User
ALTER TABLE "User" ADD COLUMN "branchId" TEXT;

-- DropColumn company from User
ALTER TABLE "User" DROP COLUMN "company";

-- CreateIndex Cashier
CREATE INDEX "Cashier_branchId_idx" ON "Cashier"("branchId");

-- CreateIndex User
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateUnique Cashier
CREATE UNIQUE INDEX "Cashier_email_key" ON "Cashier"("email");

-- AddForeignKey
ALTER TABLE "Cashier" ADD CONSTRAINT "Cashier_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
