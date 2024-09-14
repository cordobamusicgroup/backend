-- DropForeignKey
ALTER TABLE "clients_balances" DROP CONSTRAINT "clients_balances_clientId_fkey";

-- AddForeignKey
ALTER TABLE "clients_balances" ADD CONSTRAINT "clients_balances_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
