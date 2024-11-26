/*
  Warnings:

  - You are about to drop the column `reportMonth` on the `BaseRoyaltyReport` table. All the data in the column will be lost.
  - Added the required column `reportingMonth` to the `BaseRoyaltyReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalEarnings` to the `BaseRoyaltyReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BaseRoyaltyReport" DROP COLUMN "reportMonth",
ADD COLUMN     "reportingMonth" TEXT NOT NULL,
ADD COLUMN     "totalEarnings" DOUBLE PRECISION NOT NULL;
