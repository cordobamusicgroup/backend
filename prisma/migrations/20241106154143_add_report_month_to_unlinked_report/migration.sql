/*
  Warnings:

  - You are about to drop the column `reportingMonth` on the `unlinked_details_reports` table. All the data in the column will be lost.
  - Added the required column `reportingMonth` to the `unlinked_reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "unlinked_details_reports" DROP COLUMN "reportingMonth";

-- AlterTable
ALTER TABLE "unlinked_reports" ADD COLUMN     "reportingMonth" TEXT NOT NULL;
