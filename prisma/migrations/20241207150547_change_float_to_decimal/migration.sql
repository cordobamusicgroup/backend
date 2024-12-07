/*
  Warnings:

  - You are about to alter the column `totalRoyalties` on the `UserRoyaltyReport` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `totalRoyalties` on the `base_royalties_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `totalEarnings` on the `base_royalties_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "UserRoyaltyReport" ALTER COLUMN "totalRoyalties" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "base_royalties_reports" ALTER COLUMN "totalRoyalties" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "totalEarnings" SET DATA TYPE DECIMAL(65,30);
