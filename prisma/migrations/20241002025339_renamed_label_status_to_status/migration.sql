/*
  Warnings:

  - You are about to drop the column `labelStatus` on the `labels` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "labels" DROP COLUMN "labelStatus",
ADD COLUMN     "status" "label_statuses" NOT NULL DEFAULT 'ACTIVE';
