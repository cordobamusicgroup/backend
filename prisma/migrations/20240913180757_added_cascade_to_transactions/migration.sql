-- DropForeignKey
ALTER TABLE "clients_transactions" DROP CONSTRAINT "clients_transactions_balanceId_fkey";

-- AddForeignKey
ALTER TABLE "clients_transactions" ADD CONSTRAINT "clients_transactions_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "clients_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
