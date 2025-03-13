/*
  Warnings:

  - You are about to drop the `workflows` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "workflows" DROP CONSTRAINT "workflows_clientId_fkey";

-- DropTable
DROP TABLE "workflows";

-- DropEnum
DROP TYPE "StepTypeWorkflow";
