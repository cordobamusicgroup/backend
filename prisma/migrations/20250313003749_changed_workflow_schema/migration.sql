/*
  Warnings:

  - The values [USER_REGISTRATION,USER_UPDATE] on the enum `StepTypeWorkflow` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `workflows` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FormKeyWorkflow" AS ENUM ('UPDATE_PAYMENT_INFORMATION', 'REQUEST_PAYMENT');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'FAILED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ApprovalPolicy" AS ENUM ('ONE', 'ALL');

-- CreateEnum - Create new enum type directly with all desired values
CREATE TYPE "StepTypeWorkflow_new" AS ENUM ('APPROVAL', 'NOTIFICATION', 'USER_INPUT');

-- DropForeignKey
ALTER TABLE "workflows" DROP CONSTRAINT "workflows_clientId_fkey";

-- DropTable
DROP TABLE "workflows";

-- AlterTable
ALTER TABLE "users" ADD COLUMN "workflowStepId" INTEGER;

-- CreateTable - Create the workflows table first
CREATE TABLE "Workflow" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable - Create workflows_steps with the new enum type directly
CREATE TABLE "workflows_steps" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "StepTypeWorkflow_new" NOT NULL,
    "assigneesRoles" "roles"[],
    "approvalPolicy" "ApprovalPolicy",
    "actions" JSONB,

    CONSTRAINT "workflows_steps_pkey" PRIMARY KEY ("id")
);

-- Drop old enum and rename new one
DROP TYPE IF EXISTS "StepTypeWorkflow";
ALTER TYPE "StepTypeWorkflow_new" RENAME TO "StepTypeWorkflow";

-- AddForeignKey
ALTER TABLE "workflows_steps" ADD CONSTRAINT "workflows_steps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "workflows_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
