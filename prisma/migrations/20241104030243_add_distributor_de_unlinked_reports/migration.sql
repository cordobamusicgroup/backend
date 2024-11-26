/*
  Warnings:

  - Added the required column `distributor` to the `unlinked_reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "unlinked_reports" ADD COLUMN     "distributor" "distributors" NOT NULL;
