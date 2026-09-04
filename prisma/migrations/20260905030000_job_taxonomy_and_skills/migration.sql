-- Phase 3 of the recruitment-platform refactor: JobType conflated employment
-- type (FULL_TIME/PART_TIME/CONTRACT/INTERNSHIP) with remote-work mode
-- (REMOTE), making a full-time remote job unrepresentable. Split into
-- EmploymentType + WorkMode. Also adds a structured Job <-> Skill taxonomy
-- and indexes matching real query patterns (job search always filters
-- status='OPEN'; the expiry cron filters status+expiresAt).

CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- Job: add new columns, backfill from the old jobType, drop the old column.
-- REMOTE had no employment-type information, so it defaults to FULL_TIME —
-- the most common case — documented here as a best-guess, not a real fact
-- recovered from the old data.
ALTER TABLE "jobs"
  ADD COLUMN "employmentType" "EmploymentType",
  ADD COLUMN "workMode" "WorkMode";

UPDATE "jobs" SET
  "employmentType" = (CASE WHEN "jobType"::text = 'REMOTE' THEN 'FULL_TIME' ELSE "jobType"::text END)::"EmploymentType",
  "workMode" = (CASE WHEN "jobType"::text = 'REMOTE' THEN 'REMOTE' ELSE 'ONSITE' END)::"WorkMode";

ALTER TABLE "jobs"
  ALTER COLUMN "employmentType" SET NOT NULL,
  ALTER COLUMN "employmentType" SET DEFAULT 'FULL_TIME',
  ALTER COLUMN "workMode" SET NOT NULL,
  ALTER COLUMN "workMode" SET DEFAULT 'ONSITE';

ALTER TABLE "jobs" DROP COLUMN "jobType";

-- SavedSearch: same split, but nullable (an unset filter means "any").
ALTER TABLE "saved_searches"
  ADD COLUMN "employmentType" "EmploymentType",
  ADD COLUMN "workMode" "WorkMode";

UPDATE "saved_searches" SET
  "employmentType" = CASE
    WHEN "jobType" IS NULL THEN NULL
    WHEN "jobType"::text = 'REMOTE' THEN 'FULL_TIME'::"EmploymentType"
    ELSE "jobType"::text::"EmploymentType"
  END,
  "workMode" = CASE
    WHEN "jobType" IS NULL THEN NULL
    WHEN "jobType"::text = 'REMOTE' THEN 'REMOTE'::"WorkMode"
    ELSE 'ONSITE'::"WorkMode"
  END;

ALTER TABLE "saved_searches" DROP COLUMN "jobType";

DROP TYPE "JobType";

-- New indexes matching real query patterns (see job.infra-repository.ts /
-- job-prisma.repository.ts): public search always filters status='OPEN'
-- and sorts by createdAt by default; the expiry cron filters status+expiresAt.
CREATE INDEX "jobs_status_createdAt_idx" ON "jobs"("status", "createdAt");
CREATE INDEX "jobs_companyId_status_idx" ON "jobs"("companyId", "status");
CREATE INDEX "jobs_categoryId_status_idx" ON "jobs"("categoryId", "status");
CREATE INDEX "jobs_status_expiresAt_idx" ON "jobs"("status", "expiresAt");

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateTable
CREATE TABLE "job_skills" (
    "jobId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "job_skills_pkey" PRIMARY KEY ("jobId","skillId")
);

CREATE INDEX "job_skills_skillId_idx" ON "job_skills"("skillId");

ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
