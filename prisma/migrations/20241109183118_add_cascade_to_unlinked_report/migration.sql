-- DropForeignKey
ALTER TABLE "unlinked_details_reports" DROP CONSTRAINT "unlinked_details_reports_unlinkedReportId_fkey";

-- AddForeignKey
ALTER TABLE "unlinked_details_reports" ADD CONSTRAINT "unlinked_details_reports_unlinkedReportId_fkey" FOREIGN KEY ("unlinkedReportId") REFERENCES "unlinked_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
