CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');

CREATE TABLE "Transaction" (
  "id" SERIAL NOT NULL,
  "date" DATE NOT NULL,
  "type" "TransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
