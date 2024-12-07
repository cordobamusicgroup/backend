-- AlterTable
ALTER TABLE "UserRoyaltyReport" ADD COLUMN     "paidOn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "base_royalties_reports" ADD COLUMN     "paidOn" TIMESTAMP(3);
