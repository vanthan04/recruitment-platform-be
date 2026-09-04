-- Phase 2 of the recruitment-platform refactor: ApplicationStatus grows from a
-- binary PENDING/ACCEPTED/REJECTED/WITHDRAWN into a recruiting pipeline
-- (APPLIED -> SCREENING -> SHORTLISTED -> INTERVIEW -> OFFER -> HIRED, with
-- REJECTED/WITHDRAWN as side exits), and every status change is now recorded
-- in ApplicationStatusHistory instead of only overwriting the current status.

-- Recreate the enum with the new value set, remapping existing data:
-- PENDING -> APPLIED, ACCEPTED -> HIRED (the only two statuses that existed
-- before this pipeline was introduced), REJECTED/WITHDRAWN pass through.
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";

CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN');

ALTER TABLE "job_applications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "job_applications" ALTER COLUMN "status" TYPE "ApplicationStatus" USING (
  CASE "status"::text
    WHEN 'PENDING' THEN 'APPLIED'
    WHEN 'ACCEPTED' THEN 'HIRED'
    WHEN 'REJECTED' THEN 'REJECTED'
    WHEN 'WITHDRAWN' THEN 'WITHDRAWN'
  END
)::"ApplicationStatus";
ALTER TABLE "job_applications" ALTER COLUMN "status" SET DEFAULT 'APPLIED';

DROP TYPE "ApplicationStatus_old";

-- New indexes matching real query patterns: countByJobIdGroupedByStatus
-- (jobId, status) and findAllByUserId ordered by createdAt, previously
-- unindexed entirely.
CREATE INDEX "job_applications_jobId_status_idx" ON "job_applications"("jobId", "status");
CREATE INDEX "job_applications_userId_createdAt_idx" ON "job_applications"("userId", "createdAt");

-- CreateTable
CREATE TABLE "application_status_histories" (
    "id" TEXT NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT NOT NULL,
    "changedById" TEXT,

    CONSTRAINT "application_status_histories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "application_status_histories_applicationId_createdAt_idx" ON "application_status_histories"("applicationId", "createdAt");

ALTER TABLE "application_status_histories" ADD CONSTRAINT "application_status_histories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_status_histories" ADD CONSTRAINT "application_status_histories_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
