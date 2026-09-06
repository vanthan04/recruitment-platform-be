-- Job.address: new optional street-level address for this specific posting,
-- separate from the required `location` (city/area, used for search).

ALTER TABLE "jobs" ADD COLUMN "address" TEXT;

-- Job.workingHours: same treatment as requirements/benefits — a schedule is
-- often more than one fact ("Mon-Fri 08:30-17:30", "Lunch break 12:00-13:30"),
-- so it moves from a single paragraph to one bullet per array element.

ALTER TABLE "jobs" ADD COLUMN "workingHours_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "jobs"
SET "workingHours_new" = COALESCE(
  (SELECT array_agg(btrim(line)) FROM unnest(string_to_array("workingHours", E'\n')) AS line WHERE btrim(line) <> ''),
  ARRAY[]::TEXT[]
)
WHERE "workingHours" IS NOT NULL;

ALTER TABLE "jobs" DROP COLUMN "workingHours";
ALTER TABLE "jobs" RENAME COLUMN "workingHours_new" TO "workingHours";
