-- CreateEnum
CREATE TYPE "currencies" AS ENUM ('USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "distributors" AS ENUM ('BELIEVE', 'KONTOR');

-- CreateEnum
CREATE TYPE "clients_types" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "roles" AS ENUM ('ADMIN', 'ADMIN_CONTENT', 'ADMIN_LEGAL', 'ADMIN_MANAGER', 'USER');

-- CreateEnum
CREATE TYPE "label_registrations_statuses" AS ENUM ('NO_REGISTRATION', 'PENDING', 'ACTIVE');

-- CreateEnum
CREATE TYPE "label_statuses" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "roles" NOT NULL DEFAULT 'USER',
    "clientId" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "clients_types" NOT NULL,
    "addressId" INTEGER NOT NULL,
    "vatId" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balances" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "currency" "currencies" NOT NULL DEFAULT 'EUR',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.00,

    CONSTRAINT "balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients_addresses" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "countryId" INTEGER NOT NULL,
    "zip" TEXT NOT NULL,

    CONSTRAINT "clients_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "continent" TEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "labelStatus" "label_statuses" NOT NULL DEFAULT 'ACTIVE',
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "countryId" INTEGER,
    "beatportStatus" "label_registrations_statuses" NOT NULL DEFAULT 'NO_REGISTRATION',
    "traxsourceStatus" "label_registrations_statuses" NOT NULL DEFAULT 'NO_REGISTRATION',
    "beatportUrl" TEXT,
    "traxsourceUrl" TEXT,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kontor_royalties_reports" (
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

    CONSTRAINT "kontor_royalties_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "believe_royalties_reports" (
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

    CONSTRAINT "believe_royalties_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unlinked_reports" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "labelName" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "unlinked_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unlinked_details_reports" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "unlinkedReportId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "unlinked_details_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "countries_shortCode_key" ON "countries"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "labels_name_key" ON "labels"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "clients_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balances" ADD CONSTRAINT "balances_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_addresses" ADD CONSTRAINT "clients_addresses_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kontor_royalties_reports" ADD CONSTRAINT "kontor_royalties_reports_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "believe_royalties_reports" ADD CONSTRAINT "believe_royalties_reports_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlinked_details_reports" ADD CONSTRAINT "unlinked_details_reports_unlinkedReportId_fkey" FOREIGN KEY ("unlinkedReportId") REFERENCES "unlinked_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
