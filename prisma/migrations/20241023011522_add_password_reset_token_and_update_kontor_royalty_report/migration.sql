/*
  Warnings:

  - You are about to drop the column `articleNumber` on the `kontor_royalties_reports` table. All the data in the column will be lost.
  - You are about to drop the column `artist` on the `kontor_royalties_reports` table. All the data in the column will be lost.
  - You are about to drop the column `channelType` on the `kontor_royalties_reports` table. All the data in the column will be lost.
  - You are about to drop the column `salesPeriod` on the `kontor_royalties_reports` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `kontor_royalties_reports` table. All the data in the column will be lost.
  - You are about to drop the column `workTitle` on the `kontor_royalties_reports` table. All the data in the column will be lost.
  - Added the required column `productArtist` to the `kontor_royalties_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productTitle` to the `kontor_royalties_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportingMonth` to the `kontor_royalties_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salesMonth` to the `kontor_royalties_reports` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `royalties` on the `kontor_royalties_reports` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `units` on the `kontor_royalties_reports` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
ALTER TYPE "label_registrations_statuses" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "kontor_royalties_reports" DROP COLUMN "articleNumber",
DROP COLUMN "artist",
DROP COLUMN "channelType",
DROP COLUMN "salesPeriod",
DROP COLUMN "title",
DROP COLUMN "workTitle",
ADD COLUMN     "articleNo" TEXT,
ADD COLUMN     "chType" TEXT,
ADD COLUMN     "productArtist" TEXT NOT NULL,
ADD COLUMN     "productTitle" TEXT NOT NULL,
ADD COLUMN     "reportingMonth" TEXT NOT NULL,
ADD COLUMN     "salesMonth" TEXT NOT NULL,
ALTER COLUMN "channelId" DROP NOT NULL,
DROP COLUMN "royalties",
ADD COLUMN     "royalties" DOUBLE PRECISION NOT NULL,
DROP COLUMN "units",
ADD COLUMN     "units" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_userId_key" ON "password_reset_tokens"("userId");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
