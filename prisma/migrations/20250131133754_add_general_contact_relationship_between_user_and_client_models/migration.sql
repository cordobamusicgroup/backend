-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "generalContactId" INTEGER;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_generalContactId_fkey" FOREIGN KEY ("generalContactId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
