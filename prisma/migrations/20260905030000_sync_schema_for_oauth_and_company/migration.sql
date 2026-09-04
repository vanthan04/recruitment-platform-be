-- Align database schema with current Prisma datamodel for OAuth and company profile fields.

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PRODUCT', 'OUTSOURCING', 'STARTUP', 'CONSULTING');

-- AlterTable
ALTER TABLE "companies"
  ADD COLUMN "companyType" "CompanyType",
  ADD COLUMN "province" TEXT,
  ADD COLUMN "ward" TEXT;

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "facebookId" TEXT,
  ADD COLUMN "googleId" TEXT,
  ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "oauth_login_codes" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_login_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_login_codes_codeHash_key" ON "oauth_login_codes"("codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_facebookId_key" ON "users"("facebookId");
