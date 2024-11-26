/*
  Warnings:

  - You are about to drop the `BaseRoyaltyReport` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserRoyaltyReport" DROP CONSTRAINT "UserRoyaltyReport_baseReportId_fkey";

-- DropForeignKey
ALTER TABLE "believe_reports" DROP CONSTRAINT "believe_reports_baseReportId_fkey";

-- DropForeignKey
ALTER TABLE "kontor_royalties_reports" DROP CONSTRAINT "kontor_royalties_reports_baseReportId_fkey";

-- DropTable
DROP TABLE "BaseRoyaltyReport";

-- CreateTable
CREATE TABLE "base_royalties_reports" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" "currencies" NOT NULL DEFAULT 'EUR',
    "distributor" "distributors" NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "totalRoyalties" DOUBLE PRECISION NOT NULL,
    "totalEarnings" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "base_royalties_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "base_royalties_reports_distributor_reportingMonth_key" ON "base_royalties_reports"("distributor", "reportingMonth");

-- AddForeignKey
ALTER TABLE "UserRoyaltyReport" ADD CONSTRAINT "UserRoyaltyReport_baseReportId_fkey" FOREIGN KEY ("baseReportId") REFERENCES "base_royalties_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kontor_royalties_reports" ADD CONSTRAINT "kontor_royalties_reports_baseReportId_fkey" FOREIGN KEY ("baseReportId") REFERENCES "base_royalties_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "believe_reports" ADD CONSTRAINT "believe_reports_baseReportId_fkey" FOREIGN KEY ("baseReportId") REFERENCES "base_royalties_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
