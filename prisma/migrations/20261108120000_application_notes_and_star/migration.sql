-- Recruiter-private review data on applications: a star, and internal notes.
-- Neither is ever shown to the candidate.
--
-- starredAt: NULL = not starred. Existing applications start unstarred.
-- application_notes: deleted with their application; the author is kept as an
-- attribution that is nulled (not cascaded) if that user is ever deleted —
-- same rule as application_status_histories.changedById.
--
-- Generated with `prisma migrate diff` between the previous and the new
-- schema.prisma (not `prisma migrate dev`, which would also propose dropping
-- the raw-SQL trigram indexes — see 20260914090000_ai_matching_indexes).

-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN     "starredAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "application_notes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "application_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "application_notes_applicationId_createdAt_idx" ON "application_notes"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

