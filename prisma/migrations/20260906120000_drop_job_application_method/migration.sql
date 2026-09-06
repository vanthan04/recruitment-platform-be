-- Job.applicationMethod never varied by job in practice and was never read
-- by the actual apply flow (ApplyDialog always applies through the
-- platform's own CV-based flow regardless of this field) — every recruiter
-- was just retyping the same boilerplate sentence. Dropped outright; the
-- "Ứng tuyển ngay" button is self-explanatory without it.

ALTER TABLE "jobs" DROP COLUMN "applicationMethod";
