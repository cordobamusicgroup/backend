/*
  Warnings:

  - A unique constraint covering the columns `[currency,clientId]` on the table `clients_balances` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "clients_balances_currency_clientId_key" ON "clients_balances"("currency", "clientId");
