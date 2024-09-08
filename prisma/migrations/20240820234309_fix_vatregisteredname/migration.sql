/*
  Warnings:

  - You are about to drop the column `vatRegistred` on the `clients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "vatRegistred",
ADD COLUMN     "vatRegistered" BOOLEAN NOT NULL DEFAULT false;
