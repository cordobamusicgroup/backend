/*
  Warnings:

  - You are about to alter the column `amount` on the `clients_balances` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "clients_balances" ADD COLUMN     "amountRetain" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);
