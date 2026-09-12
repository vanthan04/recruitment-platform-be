-- Backfill any historical NULLs before enforcing NOT NULL — every current
-- upload path (create-cv.command.ts) always sets fileSize from Multer's own
-- file.size, so this is defensive only. 0 is a safe sentinel, distinct from
-- any real uploaded file's size.
UPDATE "cvs" SET "fileSize" = 0 WHERE "fileSize" IS NULL;

-- AlterTable
ALTER TABLE "cvs" ALTER COLUMN "fileSize" SET NOT NULL;
