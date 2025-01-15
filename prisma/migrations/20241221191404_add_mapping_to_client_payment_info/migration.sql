/*
  Warnings:

  - You are about to drop the `clients_payment_information` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "clients_payment_information" DROP CONSTRAINT "clients_payment_information_clientId_fkey";

-- DropTable
DROP TABLE "clients_payment_information";

-- CreateTable
CREATE TABLE "clients_payments_information" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER NOT NULL,
    "paymentMethod" "payment_methods",
    "data" JSONB,

    CONSTRAINT "clients_payments_information_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_payments_information_clientId_key" ON "clients_payments_information"("clientId");

-- AddForeignKey
ALTER TABLE "clients_payments_information" ADD CONSTRAINT "clients_payments_information_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
