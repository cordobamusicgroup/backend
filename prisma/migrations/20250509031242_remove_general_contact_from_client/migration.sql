/*
  Warnings:

  - You are about to drop the column `generalContactId` on the `clients` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_generalContactId_fkey";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "generalContactId";
