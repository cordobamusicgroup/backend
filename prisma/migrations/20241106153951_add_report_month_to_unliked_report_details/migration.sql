/*
  Warnings:

  - Added the required column `reportingMonth` to the `unlinked_details_reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "unlinked_details_reports" ADD COLUMN     "reportingMonth" TEXT NOT NULL;
