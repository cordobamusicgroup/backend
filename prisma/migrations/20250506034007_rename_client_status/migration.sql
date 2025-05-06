/*
  Warnings:

  - You are about to drop the column `clientStatus` on the `clients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clients" RENAME COLUMN "clientStatus" TO "status";
-- Si necesitas cambiar el tipo o el default, puedes agregar:
-- ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
-- ALTER TABLE "clients" ALTER COLUMN "status" SET NOT NULL;
-- ALTER TABLE "clients" ALTER COLUMN "status" TYPE "clients_statuses" USING "status"::text::"clients_statuses";
