-- CreateEnum
CREATE TYPE "currencies" AS ENUM ('USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "distributors" AS ENUM ('BELIEVE', 'KONTOR');

-- CreateEnum
CREATE TYPE "payment_methods" AS ENUM ('BANK_TRANSFER', 'PAYPAL', 'CRYPTO');

-- CreateEnum
CREATE TYPE "AccessTypeDMB" AS ENUM ('STANDARD', 'ADVANCED');

-- CreateEnum
CREATE TYPE "roles" AS ENUM ('ADMIN', 'ADMIN_CONTENT', 'ADMIN_LEGAL', 'ADMIN_MANAGER', 'USER');

-- CreateEnum
CREATE TYPE "communication_channels" AS ENUM ('MOBILE', 'PHONE', 'SKYPE', 'X_TWITTER', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'TWITCH', 'VK');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'ROYALTIES', 'RECALLED_PAYMENT', 'BOUNCEDBACK_PAYMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DebitState" AS ENUM ('PAID', 'UNPAID', 'OPEN');

-- CreateEnum
CREATE TYPE "contracts_types" AS ENUM ('DISTRIBUTION_NONEXCLUSIVE', 'DISTRIBUTION_EXCLUSIVE', 'LICENSING', 'PUBLISHING', 'MANAGEMENT', 'PRODUCTION', 'PROMOTION', 'OTHER');

-- CreateEnum
CREATE TYPE "clients_types" AS ENUM ('PERSON', 'BUSINESS');

-- CreateEnum
CREATE TYPE "clients_tax_id_types" AS ENUM ('COMPANY_NUMBER', 'NATIONAL_ID', 'PASSPORT', 'RESIDENT_PERMIT', 'ID_CARD', 'DRIVERS_LICENSE');

-- CreateEnum
CREATE TYPE "label_registrations_statuses" AS ENUM ('NO_REGISTRATION', 'PENDING', 'REJECTED', 'ACTIVE');

-- CreateEnum
CREATE TYPE "label_statuses" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "contracts_statuses" AS ENUM ('ACTIVE', 'TERMINATED', 'EXPIRED', 'DRAFT');

-- CreateEnum
CREATE TYPE "dmb_statuses" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateTable
CREATE TABLE "initialization_status" (
    "id" SERIAL NOT NULL,
    "initialized" BOOLEAN NOT NULL DEFAULT false,
    "adminInit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "initialization_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "s3_files" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "folder" TEXT,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "s3_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL DEFAULT 'Change Me',
    "role" "roles" NOT NULL DEFAULT 'USER',
    "clientId" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_preferences" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,
    "fontSize" TEXT,
    "mainMenuCollapsed" BOOLEAN,
    "theme" TEXT,
    "language" TEXT,

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
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "wp_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "type" "clients_types" NOT NULL DEFAULT 'PERSON',
    "addressId" INTEGER NOT NULL,
    "taxIdType" "clients_tax_id_types" NOT NULL,
    "taxId" TEXT NOT NULL,
    "vatRegistered" BOOLEAN NOT NULL DEFAULT false,
    "vatId" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isPaymentsBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isPaymentInProgress" BOOLEAN NOT NULL DEFAULT false,
    "isPaymentDataInValidation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients_dmb" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER NOT NULL,
    "accessType" "AccessTypeDMB" NOT NULL DEFAULT 'STANDARD',
    "status" "dmb_statuses" NOT NULL DEFAULT 'PENDING',
    "subclientName" TEXT,
    "username" TEXT,

    CONSTRAINT "clients_dmb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients_payment_data" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER NOT NULL,
    "paymentMethod" "payment_methods" NOT NULL,
    "clientBankId" INTEGER,
    "data" JSONB,

    CONSTRAINT "clients_payment_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients_payment_banks" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountType" "clients_types" NOT NULL DEFAULT 'PERSON',
    "accountHolder" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "swiftCode" TEXT,

    CONSTRAINT "clients_payment_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contractType" "contracts_types" NOT NULL DEFAULT 'DISTRIBUTION_EXCLUSIVE',
    "ppd" DOUBLE PRECISION DEFAULT 75.00,
    "status" "contracts_statuses" NOT NULL DEFAULT 'DRAFT',
    "docUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "clients_transactions" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "balanceAmount" DECIMAL(65,30) NOT NULL,
    "distributor" "distributors",
    "balanceId" INTEGER NOT NULL,
    "baseReportId" INTEGER,
    "userReportId" INTEGER,

    CONSTRAINT "clients_transactions_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "label_statuses" NOT NULL DEFAULT 'ACTIVE',
    "website" TEXT,
    "countryId" INTEGER,
    "beatportStatus" "label_registrations_statuses" NOT NULL DEFAULT 'NO_REGISTRATION',
    "traxsourceStatus" "label_registrations_statuses" NOT NULL DEFAULT 'NO_REGISTRATION',
    "beatportUrl" TEXT,
    "traxsourceUrl" TEXT,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "base_royalties_reports" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" "currencies" NOT NULL DEFAULT 'EUR',
    "distributor" "distributors" NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "totalRoyalties" DOUBLE PRECISION NOT NULL,
    "totalEarnings" DOUBLE PRECISION NOT NULL,
    "debitState" "DebitState" NOT NULL DEFAULT 'UNPAID',
    "paidOn" TIMESTAMP(3),

    CONSTRAINT "base_royalties_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoyaltyReport" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" "currencies" NOT NULL DEFAULT 'EUR',
    "distributor" "distributors" NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "totalRoyalties" DOUBLE PRECISION NOT NULL,
    "debitState" "DebitState" NOT NULL DEFAULT 'UNPAID',
    "paidOn" TIMESTAMP(3),
    "s3FileId" INTEGER,
    "baseReportId" INTEGER,
    "clientId" INTEGER,

    CONSTRAINT "UserRoyaltyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kontor_royalties_reports" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" "currencies" NOT NULL DEFAULT 'EUR',
    "labelId" INTEGER,
    "reportingMonth" TEXT NOT NULL,
    "salesMonth" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "chType" TEXT,
    "channelId" TEXT,
    "country" TEXT NOT NULL,
    "labelName" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productArtist" TEXT NOT NULL,
    "ean" TEXT NOT NULL,
    "isrc" TEXT NOT NULL,
    "grid" TEXT NOT NULL,
    "articleNo" TEXT,
    "royalties" DECIMAL(65,30) NOT NULL,
    "units" INTEGER NOT NULL,
    "cmg_clientRate" DECIMAL(65,30),
    "cmg_netRevenue" DECIMAL(65,30),
    "baseReportId" INTEGER,
    "userReportId" INTEGER,

    CONSTRAINT "kontor_royalties_reports_pkey" PRIMARY KEY ("id")
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
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "mechanicalFee" DECIMAL(65,30) NOT NULL,
    "grossRevenue" DECIMAL(65,30) NOT NULL,
    "clientShareRate" DECIMAL(65,30) NOT NULL,
    "netRevenue" DECIMAL(65,30) NOT NULL,
    "cmg_clientRate" DECIMAL(65,30),
    "cmg_netRevenue" DECIMAL(65,30),
    "baseReportId" INTEGER,
    "userReportId" INTEGER,

    CONSTRAINT "believe_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unlinked_reports" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "distributor" "distributors" NOT NULL,
    "reportingMonth" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "password_reset_tokens_userId_key" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_wp_id_key" ON "clients"("wp_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_clientName_key" ON "clients"("clientName");

-- CreateIndex
CREATE UNIQUE INDEX "clients_dmb_clientId_key" ON "clients_dmb"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_payment_data_clientId_key" ON "clients_payment_data"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_clientId_key" ON "contracts"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_uuid_key" ON "contracts"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "clients_balances_currency_clientId_key" ON "clients_balances"("currency", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "countries_shortCode_key" ON "countries"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "labels_name_key" ON "labels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "base_royalties_reports_distributor_reportingMonth_key" ON "base_royalties_reports"("distributor", "reportingMonth");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_preferences" ADD CONSTRAINT "users_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_comms" ADD CONSTRAINT "users_comms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "clients_addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_dmb" ADD CONSTRAINT "clients_dmb_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_payment_data" ADD CONSTRAINT "clients_payment_data_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_payment_data" ADD CONSTRAINT "clients_payment_data_clientBankId_fkey" FOREIGN KEY ("clientBankId") REFERENCES "clients_payment_banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_balances" ADD CONSTRAINT "clients_balances_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_transactions" ADD CONSTRAINT "clients_transactions_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "clients_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_transactions" ADD CONSTRAINT "clients_transactions_baseReportId_fkey" FOREIGN KEY ("baseReportId") REFERENCES "base_royalties_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_transactions" ADD CONSTRAINT "clients_transactions_userReportId_fkey" FOREIGN KEY ("userReportId") REFERENCES "UserRoyaltyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients_addresses" ADD CONSTRAINT "clients_addresses_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoyaltyReport" ADD CONSTRAINT "UserRoyaltyReport_s3FileId_fkey" FOREIGN KEY ("s3FileId") REFERENCES "s3_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoyaltyReport" ADD CONSTRAINT "UserRoyaltyReport_baseReportId_fkey" FOREIGN KEY ("baseReportId") REFERENCES "base_royalties_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoyaltyReport" ADD CONSTRAINT "UserRoyaltyReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kontor_royalties_reports" ADD CONSTRAINT "kontor_royalties_reports_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kontor_royalties_reports" ADD CONSTRAINT "kontor_royalties_reports_baseReportId_fkey" FOREIGN KEY ("baseReportId") REFERENCES "base_royalties_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kontor_royalties_reports" ADD CONSTRAINT "kontor_royalties_reports_userReportId_fkey" FOREIGN KEY ("userReportId") REFERENCES "UserRoyaltyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "believe_reports" ADD CONSTRAINT "believe_reports_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "believe_reports" ADD CONSTRAINT "believe_reports_baseReportId_fkey" FOREIGN KEY ("baseReportId") REFERENCES "base_royalties_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "believe_reports" ADD CONSTRAINT "believe_reports_userReportId_fkey" FOREIGN KEY ("userReportId") REFERENCES "UserRoyaltyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlinked_details_reports" ADD CONSTRAINT "unlinked_details_reports_unlinkedReportId_fkey" FOREIGN KEY ("unlinkedReportId") REFERENCES "unlinked_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
