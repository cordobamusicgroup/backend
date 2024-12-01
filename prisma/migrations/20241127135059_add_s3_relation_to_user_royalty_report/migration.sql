-- AlterTable
ALTER TABLE "UserRoyaltyReport" ADD COLUMN     "s3FileId" INTEGER;

-- AddForeignKey
ALTER TABLE "UserRoyaltyReport" ADD CONSTRAINT "UserRoyaltyReport_s3FileId_fkey" FOREIGN KEY ("s3FileId") REFERENCES "s3_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
