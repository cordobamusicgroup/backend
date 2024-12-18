/*
  Warnings:

  - You are about to drop the `clients_payment_banks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clients_payment_data` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "clients_payment_data" DROP CONSTRAINT "clients_payment_data_clientBankId_fkey";

-- DropForeignKey
ALTER TABLE "clients_payment_data" DROP CONSTRAINT "clients_payment_data_clientId_fkey";

-- DropTable
DROP TABLE "clients_payment_banks";

-- DropTable
DROP TABLE "clients_payment_data";

-- CreateTable
CREATE TABLE "workflows" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formKey" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "stepStatus" TEXT NOT NULL,
    "stepData" JSONB,
    "entryData" JSONB NOT NULL,
    "statusForm" TEXT NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients_payment_information" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER NOT NULL,
    "paymentMethod" "payment_methods",
    "data" JSONB,

    CONSTRAINT "clients_payment_information_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_payment_information_clientId_key" ON "clients_payment_information"("clientId");

-- AddForeignKey
ALTER TABLE "clients_payment_information" ADD CONSTRAINT "clients_payment_information_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
