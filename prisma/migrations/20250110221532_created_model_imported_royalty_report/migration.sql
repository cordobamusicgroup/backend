-- CreateTable
CREATE TABLE "imported_royalties_reports" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "distributor" "distributors" NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "s3FileId" INTEGER NOT NULL,

    CONSTRAINT "imported_royalties_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "imported_royalties_reports" ADD CONSTRAINT "imported_royalties_reports_s3FileId_fkey" FOREIGN KEY ("s3FileId") REFERENCES "s3_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
