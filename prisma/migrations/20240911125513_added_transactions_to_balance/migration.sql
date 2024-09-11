-- CreateTable
CREATE TABLE "clients_transactions" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transactionId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAmount" DOUBLE PRECISION NOT NULL,
    "balanceId" INTEGER NOT NULL,

    CONSTRAINT "clients_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_transactions_transactionId_key" ON "clients_transactions"("transactionId");

-- AddForeignKey
ALTER TABLE "clients_transactions" ADD CONSTRAINT "clients_transactions_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "clients_balances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
