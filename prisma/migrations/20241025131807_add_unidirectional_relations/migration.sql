-- AlterTable
ALTER TABLE "believe_reports" ADD COLUMN     "baseReportId" INTEGER;

-- AlterTable
ALTER TABLE "kontor_royalties_reports" ADD COLUMN     "baseReportId" INTEGER;

-- CreateTable
CREATE TABLE "BaseRoyaltyReport" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" "currencies" NOT NULL DEFAULT 'EUR',
    "distributor" "distributors" NOT NULL,
    "reportMonth" TEXT NOT NULL,
    "totalRoyalties" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BaseRoyaltyReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "kontor_royalties_reports" ADD CONSTRAINT "kontor_royalties_reports_baseReportId_fkey" FOREIGN KEY ("baseReportId") REFERENCES "BaseRoyaltyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "believe_reports" ADD CONSTRAINT "believe_reports_baseReportId_fkey" FOREIGN KEY ("baseReportId") REFERENCES "BaseRoyaltyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
