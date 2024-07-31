/*
  Warnings:

  - You are about to drop the column `language` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `kontor_reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "contracts_statuses" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "contracts_types" AS ENUM ('DISTRIBUTION_NONEXCLUSIVE', 'DISTRIBUTION_EXCLUSIVE', 'LICENSING', 'PUBLISHING', 'MANAGEMENT', 'PRODUCTION', 'PROMOTION', 'OTHER');

-- DropForeignKey
ALTER TABLE "kontor_reports" DROP CONSTRAINT "kontor_reports_labelId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "language";

-- AlterTable
ALTER TABLE "users_preferences" ADD COLUMN     "language" TEXT;

-- DropTable
DROP TABLE "kontor_reports";

-- CreateTable
CREATE TABLE "agreements" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER,
    "contractId" INTEGER NOT NULL,
    "contractType" "contracts_types" NOT NULL DEFAULT 'DISTRIBUTION_EXCLUSIVE',
    "ppd" DOUBLE PRECISION DEFAULT 75.00,
    "status" "contracts_statuses" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT,

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kontor_royalties_reports" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" "currencies" NOT NULL DEFAULT 'EUR',
    "labelId" INTEGER,
    "labelName" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "grid" TEXT NOT NULL,
    "ean" TEXT NOT NULL,
    "articleNumber" TEXT NOT NULL,
    "isrc" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workTitle" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "salesPeriod" TEXT NOT NULL,
    "royalties" TEXT NOT NULL,
    "units" TEXT NOT NULL,
    "clientRate" TEXT,
    "netRenueve" TEXT,

    CONSTRAINT "kontor_royalties_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agreements_clientId_key" ON "agreements"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "agreements_contractId_key" ON "agreements"("contractId");

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kontor_royalties_reports" ADD CONSTRAINT "kontor_royalties_reports_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
