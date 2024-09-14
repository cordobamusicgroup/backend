/*
  Warnings:

  - The values [ADVCASH_VOLET] on the enum `payment_methods` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `addressId` on table `clients` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "payment_methods_new" AS ENUM ('BANK_TRANSFER', 'PAYPAL', 'CRYPTO');
ALTER TABLE "clients_payment_data" ALTER COLUMN "paymentMethod" TYPE "payment_methods_new" USING ("paymentMethod"::text::"payment_methods_new");
ALTER TYPE "payment_methods" RENAME TO "payment_methods_old";
ALTER TYPE "payment_methods_new" RENAME TO "payment_methods";
DROP TYPE "payment_methods_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_addressId_fkey";

-- DropForeignKey
ALTER TABLE "clients_dmb" DROP CONSTRAINT "clients_dmb_clientId_fkey";

-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "addressId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "clients_addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_dmb" ADD CONSTRAINT "clients_dmb_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
