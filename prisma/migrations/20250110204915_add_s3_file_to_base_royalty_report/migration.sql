-- AlterTable
ALTER TABLE "base_royalties_reports" ADD COLUMN     "s3FileId" INTEGER;

-- AddForeignKey
ALTER TABLE "base_royalties_reports" ADD CONSTRAINT "base_royalties_reports_s3FileId_fkey" FOREIGN KEY ("s3FileId") REFERENCES "s3_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
