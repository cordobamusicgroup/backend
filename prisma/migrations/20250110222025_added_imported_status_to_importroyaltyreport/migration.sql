/*
  Warnings:

  - Added the required column `importStatus` to the `imported_royalties_reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "imported_royalties_reports" ADD COLUMN     "importStatus" TEXT NOT NULL;
