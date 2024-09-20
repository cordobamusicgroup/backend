/*
  Warnings:

  - You are about to drop the column `contractId` on the `contracts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uuid]` on the table `contracts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "contracts_contractId_key";

-- AlterTable
ALTER TABLE "contracts" DROP COLUMN "contractId",
ADD COLUMN     "uuid" UUID NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "contracts_uuid_key" ON "contracts"("uuid");
