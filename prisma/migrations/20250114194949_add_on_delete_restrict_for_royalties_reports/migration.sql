-- DropForeignKey
ALTER TABLE "believe_reports" DROP CONSTRAINT "believe_reports_labelId_fkey";

-- DropForeignKey
ALTER TABLE "kontor_royalties_reports" DROP CONSTRAINT "kontor_royalties_reports_labelId_fkey";

-- AddForeignKey
ALTER TABLE "kontor_royalties_reports" ADD CONSTRAINT "kontor_royalties_reports_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "believe_reports" ADD CONSTRAINT "believe_reports_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
