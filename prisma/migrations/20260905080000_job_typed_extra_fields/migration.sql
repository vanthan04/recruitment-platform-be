-- Replace Job.extraInfo (free-form JSON) with two typed, validated columns.
-- The frontend has only ever read/written exactly two keys through it
-- (workingHours, applicationMethod) — this migration promotes those two
-- keys to real columns and drops the untyped JSON blob.

ALTER TABLE "jobs" ADD COLUMN "workingHours" TEXT;
ALTER TABLE "jobs" ADD COLUMN "applicationMethod" TEXT;

UPDATE "jobs"
SET
  "workingHours" = "extraInfo" ->> 'workingHours',
  "applicationMethod" = "extraInfo" ->> 'applicationMethod'
WHERE "extraInfo" IS NOT NULL;

ALTER TABLE "jobs" DROP COLUMN "extraInfo";
