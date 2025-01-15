-- DropForeignKey
ALTER TABLE "imported_royalties_reports" DROP CONSTRAINT "imported_royalties_reports_s3FileId_fkey";

-- AlterTable
ALTER TABLE "imported_royalties_reports" ALTER COLUMN "s3FileId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "imported_royalties_reports" ADD CONSTRAINT "imported_royalties_reports_s3FileId_fkey" FOREIGN KEY ("s3FileId") REFERENCES "s3_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
