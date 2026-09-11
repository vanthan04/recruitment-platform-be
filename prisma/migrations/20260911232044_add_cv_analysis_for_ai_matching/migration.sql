-- `prisma migrate dev` (without --create-only) auto-generated DROP INDEX
-- statements for companies_name_trgm_idx / jobs_description_trgm_idx /
-- jobs_title_trgm_idx here — exactly the failure mode
-- 20260911123000_job_company_search_trgm_index's own doc comment warns
-- about (Prisma's diff doesn't know about indexes with no schema.prisma
-- annotation). Caught and stripped from this file before merging; if you
-- are re-deriving this migration, do not let it drop those indexes.

-- CreateEnum
CREATE TYPE "CvAnalysisStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "cv_analyses" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "status" "CvAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "summary" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceYears" DOUBLE PRECISION,
    "education" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extractedText" TEXT,
    "model" TEXT,
    "analyzedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cv_analyses_cvId_key" ON "cv_analyses"("cvId");

-- CreateIndex
CREATE INDEX "cv_analyses_status_idx" ON "cv_analyses"("status");

-- AddForeignKey
ALTER TABLE "cv_analyses" ADD CONSTRAINT "cv_analyses_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
