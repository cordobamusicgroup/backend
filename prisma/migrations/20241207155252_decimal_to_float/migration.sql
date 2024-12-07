/*
  Warnings:

  - You are about to alter the column `totalRoyalties` on the `UserRoyaltyReport` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `totalRoyalties` on the `base_royalties_reports` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `totalEarnings` on the `base_royalties_reports` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "UserRoyaltyReport" ALTER COLUMN "totalRoyalties" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "base_royalties_reports" ALTER COLUMN "totalRoyalties" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "totalEarnings" SET DATA TYPE DOUBLE PRECISION;
