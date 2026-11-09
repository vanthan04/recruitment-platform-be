-- InterviewSchedule.useRoom: the interview takes place in the platform's own
-- video room. Existing interviews keep using their external link / location.

-- AlterTable
ALTER TABLE "interview_schedules" ADD COLUMN     "useRoom" BOOLEAN NOT NULL DEFAULT false;
