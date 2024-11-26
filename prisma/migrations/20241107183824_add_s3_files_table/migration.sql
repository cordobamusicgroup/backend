-- CreateTable
CREATE TABLE "s3_files" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "folder" TEXT,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "s3_files_pkey" PRIMARY KEY ("id")
);
