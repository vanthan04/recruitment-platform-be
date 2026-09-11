-- GET /jobs?keyword=... (the platform's core search) runs `ILIKE
-- '%keyword%'` against jobs.title, jobs.description and companies.name
-- (JobInfraRepository / CompanyLookupAdapter). A leading-wildcard ILIKE
-- can't use a standard B-tree index, so every search was a sequential scan
-- on both tables — the highest-traffic read path in the app with the least
-- index support. pg_trgm's GIN indexes let Postgres use an index for
-- substring/similarity matches instead.
--
-- Prisma's schema DSL has no way to express `USING gin (col gin_trgm_ops)`
-- without the postgresqlExtensions preview feature, so — same as
-- `companies_owner_id_active_unique` (see 20260905090000_*) — this is raw
-- SQL with no matching annotation in schema.prisma.
--
-- IMPORTANT: `prisma migrate dev` diffs against schema.prisma, which
-- doesn't know these indexes exist. Any future migration touching `jobs`
-- or `companies` should be created with `--create-only` and reviewed to
-- confirm it doesn't silently DROP them before applying it.
--
-- Requires the pg_trgm extension, available by default on stock PostgreSQL
-- (and allow-listed on RDS/most managed providers) — CREATE EXTENSION
-- needs a role with sufficient privilege on the target database.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "jobs_title_trgm_idx" ON "jobs" USING gin ("title" gin_trgm_ops);
CREATE INDEX "jobs_description_trgm_idx" ON "jobs" USING gin ("description" gin_trgm_ops);
CREATE INDEX "companies_name_trgm_idx" ON "companies" USING gin ("name" gin_trgm_ops);
