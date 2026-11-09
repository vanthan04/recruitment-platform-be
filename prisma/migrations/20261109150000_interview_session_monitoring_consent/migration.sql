-- AI monitoring opt-in recorded on the interview session (Phase 3): when the
-- candidate agreed and which notice version they saw. Null = not monitored.

-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN     "monitoringConsentAt" TIMESTAMP(3),
ADD COLUMN     "monitoringNoticeVersion" TEXT;
