-- AlterTable
ALTER TABLE "UserRoyaltyReport" ADD COLUMN     "clientId" INTEGER;

-- AddForeignKey
ALTER TABLE "UserRoyaltyReport" ADD CONSTRAINT "UserRoyaltyReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
