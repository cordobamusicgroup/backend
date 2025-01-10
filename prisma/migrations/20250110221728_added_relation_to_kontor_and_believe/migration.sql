-- AlterTable
ALTER TABLE "believe_reports" ADD COLUMN     "importedReportId" INTEGER;

-- AlterTable
ALTER TABLE "kontor_royalties_reports" ADD COLUMN     "importedReportId" INTEGER;

-- AddForeignKey
ALTER TABLE "kontor_royalties_reports" ADD CONSTRAINT "kontor_royalties_reports_importedReportId_fkey" FOREIGN KEY ("importedReportId") REFERENCES "imported_royalties_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "believe_reports" ADD CONSTRAINT "believe_reports_importedReportId_fkey" FOREIGN KEY ("importedReportId") REFERENCES "imported_royalties_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
