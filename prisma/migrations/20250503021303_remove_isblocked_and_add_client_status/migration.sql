-- CreateEnum
CREATE TYPE "clients_statuses" AS ENUM ('ACTIVE', 'BLOCKED', 'TERMINATED', 'INACTIVE');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "clientStatus" "clients_statuses" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "isBlocked" DROP NOT NULL,
ALTER COLUMN "isBlocked" DROP DEFAULT,
ALTER COLUMN "isPaymentsBlocked" DROP NOT NULL,
ALTER COLUMN "isPaymentsBlocked" DROP DEFAULT;
