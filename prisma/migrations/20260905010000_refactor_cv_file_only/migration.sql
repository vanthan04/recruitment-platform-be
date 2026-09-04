-- Phase 1 of the CV refactor: CV Builder (Experience/Education/Skill CRUD, publish
-- content-requirement, PDF export) is removed. Cv becomes file-upload-only:
-- title + original filename + file type/mime/size + backend-generated S3 key.
--
-- This is a personal-project dev database — no production data to preserve. If you are
-- applying this against a database that has real user-entered CV builder content, back it
-- up first; this migration permanently discards Experience/Education/Skill rows and any
-- Cv row that was never attached to an uploaded file.

-- CreateEnum
CREATE TYPE "CvFileType" AS ENUM ('PDF', 'DOC', 'DOCX');

-- Drop CV-builder child tables — CV is now file-only, these have no equivalent.
DROP TABLE "experiences";
DROP TABLE "educations";
DROP TABLE "skills";

-- CVs that were never attached to an uploaded file (pure builder drafts, fileUrl IS NULL)
-- have no file-only equivalent under the new model — remove them. CVs that *do* have a
-- fileUrl are preserved; their new file-metadata columns are best-effort backfilled below,
-- since the old schema never stored originalName/mimeType/fileSize/fileType separately.
DELETE FROM "cvs" WHERE "fileUrl" IS NULL;

-- AlterTable: add new file-metadata columns as nullable first so we can backfill, then
-- tighten to NOT NULL once every remaining row has a value.
ALTER TABLE "cvs"
  ADD COLUMN "originalName" TEXT,
  ADD COLUMN "fileType" "CvFileType",
  ADD COLUMN "mimeType" TEXT,
  ADD COLUMN "fileSize" INTEGER,
  ADD COLUMN "fileKey" TEXT;

-- Backfill from the old fileUrl (best-effort; assumes the "<scheme>://<host>/<key>" shape
-- produced by the old S3StorageProvider.upload()). originalName <- basename of fileUrl,
-- since the old schema never captured the user's original filename separately.
UPDATE "cvs"
SET
  "fileKey" = regexp_replace("fileUrl", '^https?://[^/]+/', ''),
  "originalName" = regexp_replace("fileUrl", '^.*/', ''),
  "mimeType" = CASE
    WHEN "fileUrl" ILIKE '%.pdf' THEN 'application/pdf'
    WHEN "fileUrl" ILIKE '%.docx' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    WHEN "fileUrl" ILIKE '%.doc' THEN 'application/msword'
    ELSE 'application/octet-stream'
  END,
  "fileType" = CASE
    WHEN "fileUrl" ILIKE '%.pdf' THEN 'PDF'::"CvFileType"
    WHEN "fileUrl" ILIKE '%.docx' THEN 'DOCX'::"CvFileType"
    WHEN "fileUrl" ILIKE '%.doc' THEN 'DOC'::"CvFileType"
    ELSE 'PDF'::"CvFileType"
  END
WHERE "fileUrl" IS NOT NULL;

-- Tighten to NOT NULL now that every remaining row is backfilled.
ALTER TABLE "cvs"
  ALTER COLUMN "originalName" SET NOT NULL,
  ALTER COLUMN "fileType" SET NOT NULL,
  ALTER COLUMN "mimeType" SET NOT NULL,
  ALTER COLUMN "fileKey" SET NOT NULL;

-- Drop obsolete columns.
ALTER TABLE "cvs"
  DROP COLUMN "summary",
  DROP COLUMN "fileUrl",
  DROP COLUMN "publishedAt";

-- A successfully uploaded file is immediately usable, so default status flips to PUBLISHED.
ALTER TABLE "cvs" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';
