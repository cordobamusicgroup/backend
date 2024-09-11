/*
  Warnings:

  - You are about to drop the column `transactionId` on the `clients_transactions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "clients_transactions_transactionId_key";

-- AlterTable
ALTER TABLE "clients_transactions" DROP COLUMN "transactionId";
