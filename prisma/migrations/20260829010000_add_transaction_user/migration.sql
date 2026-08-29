DELETE FROM "Transaction";

ALTER TABLE "Transaction" ADD COLUMN "userId" TEXT NOT NULL;

CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");