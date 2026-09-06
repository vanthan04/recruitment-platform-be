-- Job.requirements/benefits move from a single free-text paragraph to a
-- string array — one bullet per element. Display-only (never filtered), so
-- this stays a plain Postgres array rather than a Skill-style lookup table.
-- Existing text is split on newlines (how the textarea already encouraged
-- recruiters to enter one item per line), each line trimmed, blank lines
-- dropped.

ALTER TABLE "jobs" ADD COLUMN "requirements_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "jobs" ADD COLUMN "benefits_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "jobs"
SET "requirements_new" = COALESCE(
  (SELECT array_agg(btrim(line)) FROM unnest(string_to_array("requirements", E'\n')) AS line WHERE btrim(line) <> ''),
  ARRAY[]::TEXT[]
)
WHERE "requirements" IS NOT NULL;

UPDATE "jobs"
SET "benefits_new" = COALESCE(
  (SELECT array_agg(btrim(line)) FROM unnest(string_to_array("benefits", E'\n')) AS line WHERE btrim(line) <> ''),
  ARRAY[]::TEXT[]
)
WHERE "benefits" IS NOT NULL;

ALTER TABLE "jobs" DROP COLUMN "requirements";
ALTER TABLE "jobs" DROP COLUMN "benefits";
ALTER TABLE "jobs" RENAME COLUMN "requirements_new" TO "requirements";
ALTER TABLE "jobs" RENAME COLUMN "benefits_new" TO "benefits";
