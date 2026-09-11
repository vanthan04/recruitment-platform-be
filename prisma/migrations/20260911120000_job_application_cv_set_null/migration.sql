-- job_applications.cvId was ON DELETE CASCADE from cvs, so hard-deleting a
-- purged CV (see PurgeDeletedCvsHandler, 30 days after soft-delete) silently
-- cascaded away the entire JobApplication row it was attached to — including
-- ApplicationStatusHistory, InterviewSchedule, Conversation and every
-- Message/MessageAttachment in it, even for HIRED applications. Switching to
-- SetNull preserves the hiring record; only the now-meaningless CV pointer
-- is cleared.

-- DropForeignKey
ALTER TABLE "job_applications" DROP CONSTRAINT "job_applications_cvId_fkey";

-- AlterTable
ALTER TABLE "job_applications" ALTER COLUMN "cvId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
