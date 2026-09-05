-- Phase 4: the platform has committed to IT-only recruitment permanently
-- (see docs/industry-expansion.md) — Company.industry is no longer a
-- free-text field kept for a hypothetical future multi-industry pivot.
ALTER TABLE "companies" DROP COLUMN "industry";
