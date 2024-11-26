-- AlterTable
ALTER TABLE "believe_reports" ADD COLUMN     "userReportId" INTEGER;

-- AlterTable
ALTER TABLE "kontor_royalties_reports" ADD COLUMN     "userReportId" INTEGER;

-- CreateTable
CREATE TABLE "UserRoyaltyReport" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" "currencies" NOT NULL DEFAULT 'EUR',
    "distributor" "distributors" NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "totalRoyalties" DOUBLE PRECISION NOT NULL,
    "baseReportId" INTEGER,

    CONSTRAINT "UserRoyaltyReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserRoyaltyReport" ADD CONSTRAINT "UserRoyaltyReport_baseReportId_fkey" FOREIGN KEY ("baseReportId") REFERENCES "BaseRoyaltyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kontor_royalties_reports" ADD CONSTRAINT "kontor_royalties_reports_userReportId_fkey" FOREIGN KEY ("userReportId") REFERENCES "UserRoyaltyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "believe_reports" ADD CONSTRAINT "believe_reports_userReportId_fkey" FOREIGN KEY ("userReportId") REFERENCES "UserRoyaltyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
