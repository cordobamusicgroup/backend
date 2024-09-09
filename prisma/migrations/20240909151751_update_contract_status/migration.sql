/*
  Warnings:

  - The values [INACTIVE,CANCELLED,PENDING] on the enum `contracts_statuses` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "contracts_statuses_new" AS ENUM ('ACTIVE', 'TERMINATED', 'EXPIRED', 'DRAFT');
ALTER TABLE "contracts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "contracts" ALTER COLUMN "status" TYPE "contracts_statuses_new" USING ("status"::text::"contracts_statuses_new");
ALTER TYPE "contracts_statuses" RENAME TO "contracts_statuses_old";
ALTER TYPE "contracts_statuses_new" RENAME TO "contracts_statuses";
DROP TYPE "contracts_statuses_old";
ALTER TABLE "contracts" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "contracts" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
