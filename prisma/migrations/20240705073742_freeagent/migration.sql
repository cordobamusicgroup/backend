-- CreateTable
CREATE TABLE "freeagent_tokens" (
    "id" SERIAL NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "freeagent_tokens_pkey" PRIMARY KEY ("id")
);
