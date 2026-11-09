-- InterviewSession: one run of an interview (Phase 1 of the YOLO interview
-- monitoring work). "Open" = endedAt IS NULL.

-- CreateTable
CREATE TABLE "interview_sessions" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewId" TEXT NOT NULL,
    "startedById" TEXT,

    CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_sessions_interviewId_startedAt_idx" ON "interview_sessions"("interviewId", "startedAt");

-- At most one open session per interview. Prisma's schema DSL cannot express a
-- partial unique index, so this is raw SQL — see the comment on
-- InterviewSession in schema.prisma. It closes the check-then-insert race in
-- StartInterviewSessionHandler (two simultaneous starts).
--
-- IMPORTANT: `prisma migrate dev` diffs against schema.prisma, which doesn't
-- know this index exists. Create any future migration touching this table with
-- `--create-only` and confirm it doesn't DROP this index.
CREATE UNIQUE INDEX "interview_sessions_open_unique" ON "interview_sessions" ("interviewId") WHERE "endedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interview_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
