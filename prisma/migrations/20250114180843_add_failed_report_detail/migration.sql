-- CreateTable
CREATE TABLE "failed_details_reports" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "distributor" "distributors" NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "labelName" TEXT NOT NULL,
    "failedReason" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "failed_details_reports_pkey" PRIMARY KEY ("id")
);
