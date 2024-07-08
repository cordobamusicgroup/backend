/*
  Warnings:

  - You are about to drop the column `continent` on the `countries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "countries" DROP COLUMN "continent";

-- CreateTable
CREATE TABLE "InitializationStatus" (
    "id" SERIAL NOT NULL,
    "initialized" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InitializationStatus_pkey" PRIMARY KEY ("id")
);
