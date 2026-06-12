-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'outros',
    "notes" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isProjection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currentValue" REAL NOT NULL,
    "targetPercent" REAL NOT NULL DEFAULT 0,
    "risk" TEXT NOT NULL DEFAULT 'moderado',
    "liquidity" TEXT NOT NULL DEFAULT 'media',
    "notes" TEXT,
    "year" INTEGER,
    "month" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Consortium" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "administrator" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "quota" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "contractedCredit" REAL NOT NULL,
    "installment" REAL NOT NULL,
    "totalInstallments" INTEGER NOT NULL,
    "paidInstallments" INTEGER NOT NULL DEFAULT 0,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "bidOffered" REAL,
    "bidAvailable" REAL,
    "contemplated" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "lastDigits" TEXT,
    "limit" REAL,
    "closingDay" INTEGER,
    "dueDay" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PatrimonySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalValue" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "monthlyContribution" REAL NOT NULL DEFAULT 0,
    "annualReturn" REAL NOT NULL DEFAULT 10,
    "emergencyMonths" INTEGER NOT NULL DEFAULT 6,
    "monthlyExpensesAvg" REAL NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE INDEX "Transaction_year_month_idx" ON "Transaction"("year", "month");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PatrimonySnapshot_year_month_key" ON "PatrimonySnapshot"("year", "month");
