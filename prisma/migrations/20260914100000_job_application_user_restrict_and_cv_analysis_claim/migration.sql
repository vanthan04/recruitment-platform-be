-- IMPORTANT: hand-picked from `prisma migrate diff`'s output, dropping the
-- DropIndex statements it also proposed for jobs_title_trgm_idx/
-- jobs_description_trgm_idx/companies_name_trgm_idx — those exist only as
-- raw SQL with no schema.prisma annotation (see
-- 20260911123000_job_company_search_trgm_index), so any schema-diff tool
-- always sees them as drift to be dropped. Same near-miss already
-- documented on that migration and on 20260914090000_ai_matching_indexes;
-- do not let a future `prisma migrate dev` apply those drops.

-- JobApplication.userId: Cascade -> Restrict. userId is the application's
-- actual identity, unlike InterviewSchedule.createdById (a nullable
-- attribution field) — there's no meaningful way to SetNull it. Cascade
-- here would transitively wipe ApplicationStatusHistory, InterviewSchedule,
-- Conversation, and every Message in it on candidate-user deletion, the
-- exact blast radius Company.owner/Job.postedBy were hardened against (see
-- 20260911121500_user_cascade_hardening_and_cv_index), just on the
-- candidate side instead of the recruiter side. There is no hard-delete-
-- user feature today; this only matters if one is ever added.

-- DropForeignKey
ALTER TABLE "job_applications" DROP CONSTRAINT "job_applications_userId_fkey";

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Claim marker for AnalyzePendingCvsCron (claimPendingCvIds) — prevents the
-- cron's next 10-minute tick from re-picking-up a CV whose analysis is
-- still in flight from a previous tick, which today doubles AI provider
-- cost and races the final write. See CvAnalysis.processingStartedAt's
-- doc comment in schema.prisma.

-- AlterTable
ALTER TABLE "cv_analyses" ADD COLUMN "processingStartedAt" TIMESTAMP(3);
