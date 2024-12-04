-- AlterTable
ALTER TABLE "clients_transactions" ADD COLUMN     "baseReportId" INTEGER,
ADD COLUMN     "userReportId" INTEGER;

-- AddForeignKey
ALTER TABLE "clients_transactions" ADD CONSTRAINT "clients_transactions_baseReportId_fkey" FOREIGN KEY ("baseReportId") REFERENCES "base_royalties_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_transactions" ADD CONSTRAINT "clients_transactions_userReportId_fkey" FOREIGN KEY ("userReportId") REFERENCES "UserRoyaltyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
