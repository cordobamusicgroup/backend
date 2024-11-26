/*
  Warnings:

  - You are about to drop the column `clientRate` on the `kontor_royalties_reports` table. All the data in the column will be lost.
  - You are about to drop the column `netRenueve` on the `kontor_royalties_reports` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "believe_reports" ADD COLUMN     "cmg_clientRate" DOUBLE PRECISION,
ADD COLUMN     "cmg_netRevenue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "kontor_royalties_reports" DROP COLUMN "clientRate",
DROP COLUMN "netRenueve",
ADD COLUMN     "cmg_clientRate" DOUBLE PRECISION,
ADD COLUMN     "cmg_netRevenue" DOUBLE PRECISION;
