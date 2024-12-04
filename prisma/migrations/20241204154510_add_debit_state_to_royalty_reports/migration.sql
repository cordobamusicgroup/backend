/*
  Warnings:

  - You are about to drop the column `reportPaid` on the `base_royalties_reports` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DebitState" AS ENUM ('PAID', 'UNPAID', 'OPEN');

-- AlterTable
ALTER TABLE "UserRoyaltyReport" ADD COLUMN     "debitState" "DebitState" NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "base_royalties_reports" DROP COLUMN "reportPaid",
ADD COLUMN     "debitState" "DebitState" NOT NULL DEFAULT 'UNPAID';
