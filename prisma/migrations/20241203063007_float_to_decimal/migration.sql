/*
  Warnings:

  - You are about to alter the column `unitPrice` on the `believe_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `mechanicalFee` on the `believe_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `grossRevenue` on the `believe_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `clientShareRate` on the `believe_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `netRevenue` on the `believe_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `cmg_clientRate` on the `believe_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `cmg_netRevenue` on the `believe_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `royalties` on the `kontor_royalties_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `cmg_clientRate` on the `kontor_royalties_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `cmg_netRevenue` on the `kontor_royalties_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "believe_reports" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "mechanicalFee" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "grossRevenue" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "clientShareRate" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "netRevenue" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "cmg_clientRate" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "cmg_netRevenue" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "kontor_royalties_reports" ALTER COLUMN "royalties" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "cmg_clientRate" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "cmg_netRevenue" SET DATA TYPE DECIMAL(65,30);
