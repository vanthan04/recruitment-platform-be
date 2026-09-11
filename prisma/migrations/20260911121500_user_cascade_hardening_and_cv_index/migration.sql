-- Company.owner / Job.postedBy: Cascade -> Restrict. There is no
-- hard-delete-user feature today, but if one is ever added, deleting a
-- recruiter must not be able to cascade away their company and,
-- transitively, every OTHER candidate's jobs/applications against it.
-- Restrict blocks the delete outright instead of silently destroying
-- unrelated data.

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_ownerId_fkey";
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_postedById_fkey";

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- InterviewSchedule.createdBy: Cascade -> SetNull (nullable), aligning it
-- with ApplicationStatusHistory.changedById. This is an attribution field
-- only — interview commands authorize against the job's postedById, never
-- createdById — so it should be preserved-but-nulled on user deletion
-- instead of taking the whole interview record down with it.

-- DropForeignKey
ALTER TABLE "interview_schedules" DROP CONSTRAINT "interview_schedules_createdById_fkey";

-- AlterTable
ALTER TABLE "interview_schedules" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- JobApplication.cvId: add the missing index. hasRecruiterAccess and
-- hasActiveApplicationReference (CvPrismaRepository) both filter on cvId
-- first for every CV-download authorization check and every soft-delete
-- reference check.
CREATE INDEX "job_applications_cvId_idx" ON "job_applications"("cvId");
