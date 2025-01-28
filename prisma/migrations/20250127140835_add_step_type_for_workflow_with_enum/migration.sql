-- CreateEnum
CREATE TYPE "StepTypeWorkflow" AS ENUM ('APPROVAL', 'NOTIFICATION', 'USER_INPUT', 'USER_REGISTRATION', 'USER_UPDATE');

-- AlterTable
ALTER TABLE "believe_reports" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "kontor_royalties_reports" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "workflows" ADD COLUMN     "stepType" "StepTypeWorkflow" NOT NULL DEFAULT 'APPROVAL';
