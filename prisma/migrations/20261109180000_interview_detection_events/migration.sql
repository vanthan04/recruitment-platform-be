-- Monitoring events (Phase 4): derived observations per interview session.
-- No images or raw inference results are stored.

-- CreateEnum
CREATE TYPE "MonitoringEventType" AS ENUM ('PERSON_ABSENT', 'MULTIPLE_PERSONS', 'PHONE_DETECTED', 'LAPTOP_DETECTED');

-- CreateTable
CREATE TABLE "interview_detection_events" (
    "id" TEXT NOT NULL,
    "eventType" "MonitoringEventType" NOT NULL,
    "objectClass" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "frameCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "interviewSessionId" TEXT NOT NULL,
    "reviewedById" TEXT,

    CONSTRAINT "interview_detection_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_detection_events_interviewSessionId_detectedAt_idx" ON "interview_detection_events"("interviewSessionId", "detectedAt");

-- CreateIndex
CREATE INDEX "interview_detection_events_interviewSessionId_eventType_idx" ON "interview_detection_events"("interviewSessionId", "eventType");

-- CreateIndex
CREATE INDEX "interview_detection_events_detectedAt_idx" ON "interview_detection_events"("detectedAt");

-- AddForeignKey
ALTER TABLE "interview_detection_events" ADD CONSTRAINT "interview_detection_events_interviewSessionId_fkey" FOREIGN KEY ("interviewSessionId") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_detection_events" ADD CONSTRAINT "interview_detection_events_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

