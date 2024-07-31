/*
  Warnings:

  - You are about to drop the `balances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `believe_royalties_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kontor_royalties_reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "communication_channels" AS ENUM ('MOBILE', 'PHONE', 'SKYPE', 'X_TWITTER', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'TWITCH', 'VK');

-- DropForeignKey
ALTER TABLE "balances" DROP CONSTRAINT "balances_clientId_fkey";

-- DropForeignKey
ALTER TABLE "believe_royalties_reports" DROP CONSTRAINT "believe_royalties_reports_labelId_fkey";

-- DropForeignKey
ALTER TABLE "kontor_royalties_reports" DROP CONSTRAINT "kontor_royalties_reports_labelId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "fullName" TEXT NOT NULL DEFAULT 'Change Me',
ADD COLUMN     "language" TEXT;

-- DropTable
DROP TABLE "balances";

-- DropTable
DROP TABLE "believe_royalties_reports";

-- DropTable
DROP TABLE "kontor_royalties_reports";

-- CreateTable
CREATE TABLE "users_preferences" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,
    "fontSize" TEXT,
    "mainMenuCollapsed" BOOLEAN,
    "theme" TEXT,

    CONSTRAINT "users_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_comms" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "communication_channels" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "users_comms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients_balances" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "currency" "currencies" NOT NULL DEFAULT 'EUR',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.00,

    CONSTRAINT "clients_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kontor_reports" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" "currencies" NOT NULL DEFAULT 'EUR',
    "labelId" INTEGER,
    "labelName" TEXT NOT NULL,
    "isrc" TEXT NOT NULL,
    "ean" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "trackTitle" TEXT NOT NULL,
    "articleNo" TEXT NOT NULL,
    "grid" TEXT NOT NULL,
    "licensee" TEXT NOT NULL,
    "outletname" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "distributionChannel" TEXT NOT NULL,
    "territory" TEXT NOT NULL,
    "salesPeriod" TEXT NOT NULL,
    "ppd" DOUBLE PRECISION NOT NULL,
    "shareCustomer" DOUBLE PRECISION NOT NULL,
    "royaltyValuePerUnit" DOUBLE PRECISION NOT NULL,
    "units" INTEGER NOT NULL,
    "netRevenue" DOUBLE PRECISION NOT NULL,
    "royaltyRate" DOUBLE PRECISION NOT NULL,
    "royaltyAmountBeforeCopyrightDed" DOUBLE PRECISION NOT NULL,
    "royaltyAmountCustomer" DOUBLE PRECISION NOT NULL,
    "dmbRetailerName" TEXT NOT NULL,
    "dmbStoreName" TEXT NOT NULL,

    CONSTRAINT "kontor_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "believe_reports" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" "currencies" NOT NULL DEFAULT 'USD',
    "labelId" INTEGER,
    "reportingMonth" TEXT NOT NULL,
    "salesMonth" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "countryRegion" TEXT NOT NULL,
    "labelName" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "releaseTitle" TEXT NOT NULL,
    "trackTitle" TEXT NOT NULL,
    "upc" TEXT NOT NULL,
    "isrc" TEXT NOT NULL,
    "catalogNb" TEXT NOT NULL,
    "streamingSubscriptionType" TEXT NOT NULL,
    "releaseType" TEXT NOT NULL,
    "salesType" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "clientPaymentCurrency" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "mechanicalFee" DOUBLE PRECISION NOT NULL,
    "grossRevenue" DOUBLE PRECISION NOT NULL,
    "clientShareRate" DOUBLE PRECISION NOT NULL,
    "netRevenue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "believe_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users_preferences" ADD CONSTRAINT "users_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_comms" ADD CONSTRAINT "users_comms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_balances" ADD CONSTRAINT "clients_balances_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kontor_reports" ADD CONSTRAINT "kontor_reports_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "believe_reports" ADD CONSTRAINT "believe_reports_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
