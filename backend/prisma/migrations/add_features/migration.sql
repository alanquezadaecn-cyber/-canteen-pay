-- CreateTable Product
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "image" TEXT,
    "branchId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable TransactionItem
CREATE TABLE "TransactionItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "TransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable CashierSession
CREATE TABLE "CashierSession" (
    "id" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "initialFloat" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalBalance" DECIMAL(10,2),
    "totalCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,

    CONSTRAINT "CashierSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable UserAlert
CREATE TABLE "UserAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAlert_pkey" PRIMARY KEY ("id")
);

-- AddColumn User
ALTER TABLE "User" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "blockReason" TEXT;
ALTER TABLE "User" ADD COLUMN "minBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateIndex Product
CREATE INDEX "Product_branchId_idx" ON "Product"("branchId");

-- CreateIndex TransactionItem
CREATE INDEX "TransactionItem_transactionId_idx" ON "TransactionItem"("transactionId");
CREATE INDEX "TransactionItem_productId_idx" ON "TransactionItem"("productId");

-- CreateIndex CashierSession
CREATE INDEX "CashierSession_branchId_idx" ON "CashierSession"("branchId");

-- AddForeignKey Product
ALTER TABLE "Product" ADD CONSTRAINT "Product_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey TransactionItem
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey CashierSession
ALTER TABLE "CashierSession" ADD CONSTRAINT "CashierSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
