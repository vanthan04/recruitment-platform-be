-- Phase 7: interview status gains COMPLETED/NO_SHOW (post-interview outcomes,
-- previously unrepresentable — an interview could only ever end up
-- SCHEDULED/RESCHEDULED/CANCELLED), plus an optional duration and an index
-- matching the query pattern in findByApplicationId (jobApplicationId,
-- ordered by scheduledAt). Notification.isRead becomes readAt so the UI can
-- show *when* a notification was read, not just whether it was.

ALTER TYPE "InterviewStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "InterviewStatus" ADD VALUE 'NO_SHOW';

ALTER TABLE "interview_schedules" ADD COLUMN "durationMinutes" INTEGER;

CREATE INDEX "interview_schedules_jobApplicationId_scheduledAt_idx" ON "interview_schedules"("jobApplicationId", "scheduledAt");

-- Notification: isRead -> readAt. Best-effort backfill — the exact original
-- read timestamp was never recorded, so already-read notifications get
-- readAt = now() (this migration's run time) rather than a fabricated past
-- date; unread notifications stay NULL.
ALTER TABLE "notifications" ADD COLUMN "readAt" TIMESTAMP(3);
UPDATE "notifications" SET "readAt" = CURRENT_TIMESTAMP WHERE "isRead" = true;
ALTER TABLE "notifications" DROP COLUMN "isRead";
