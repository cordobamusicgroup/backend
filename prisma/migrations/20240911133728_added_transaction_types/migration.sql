/*
  Warnings:

  - Changed the type of `type` on the `clients_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'ROYALTIES', 'RECALLED_PAYMENT', 'BOUNCEDBACK_PAYMENT');

-- AlterTable
ALTER TABLE "clients_transactions" DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;
