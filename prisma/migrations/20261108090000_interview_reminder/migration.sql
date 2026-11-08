-- Pre-interview reminder emails.
--
-- reminderSentAt: when the reminder for the current scheduledAt was sent (NULL =
-- not yet). Existing rows start NULL, so any interview that is still upcoming
-- when this ships gets a reminder at its normal time; past ones are never
-- picked up (the cron only looks at future, active interviews).
--
-- The index serves the cron's scan (active interviews in the next 24h).
--
-- Hand-written rather than copied from `prisma migrate dev`: see
-- 20260914090000_ai_matching_indexes — the schema diff also proposes dropping
-- the raw-SQL trigram indexes, which must never be applied.

-- AlterTable
ALTER TABLE "interview_schedules" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "interview_schedules_status_scheduledAt_idx" ON "interview_schedules"("status", "scheduledAt");
