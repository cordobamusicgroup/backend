-- AlterTable
ALTER TABLE "believe_reports" ALTER COLUMN "catalogNb" DROP NOT NULL,
ALTER COLUMN "releaseType" DROP NOT NULL,
ALTER COLUMN "salesType" DROP NOT NULL,
ALTER COLUMN "clientPaymentCurrency" DROP NOT NULL,
ALTER COLUMN "mechanicalFee" DROP NOT NULL;

-- AlterTable
ALTER TABLE "clients_dmb" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "clients_payments_information" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "contracts" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
