/*
  Warnings:

  - You are about to drop the `agreements` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "agreements" DROP CONSTRAINT "agreements_clientId_fkey";

-- DropTable
DROP TABLE "agreements";

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER,
    "contractId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contractType" "contracts_types" NOT NULL DEFAULT 'DISTRIBUTION_EXCLUSIVE',
    "ppd" DOUBLE PRECISION DEFAULT 75.00,
    "status" "contracts_statuses" NOT NULL DEFAULT 'PENDING',
    "docUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_clientId_key" ON "contracts"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractId_key" ON "contracts"("contractId");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
