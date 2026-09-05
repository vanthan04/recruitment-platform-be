# Industry scope: IT-only, permanently

## Current decision (updated)

The platform is scoped to **IT recruitment only** (not a multi-industry job
board). This was originally a soft, content-only decision (see git history
for the prior version of this doc) that kept `Company.industry` as a free-text
field in case the platform expanded to other industries later.

That plan changed: `Company.industry` has been **removed from the schema and
codebase entirely** as part of the broader recruitment-platform refactor
(see the backend's `refactor(company): remove industry field` commit). The
platform is now committed to IT-only recruitment, not just defaulted into it.

## What was removed

- `Company.industry` (Prisma schema, migration, domain entity, DTOs, mapper,
  repository filter, response DTO)
- The `industry` search/filter param on `GET /companies`
- The industry field and filter UI on the frontend (company form, company
  card, company detail page, companies list filter)

## What still reflects the IT-only scope (unchanged)

- `Category` (`prisma/schema.prisma`) still has only `name` and `slug` —
  free text, not an enum — and `prisma/seed.ts`'s `CATEGORIES` list still
  contains only IT roles (Frontend, Backend, DevOps, QA, Mobile, Data/AI,
  Security, BA/Product, UI/UX, IT Support).
- `recruitment-platform-fe/src/components/home/hero-search.tsx` —
  `POPULAR_KEYWORDS` lists IT roles only.
- `recruitment-platform-fe/src/components/home/category-grid.tsx` —
  `ICON_RULES` still has entries for non-IT categories (kế toán, marketing,
  y tế, xây dựng, ...) left in place from before the original decision;
  they're inert today (no such categories exist) and cost nothing to keep.

## If a second industry is ever added later

Since `Company.industry` is gone, a future multi-industry pivot needs a new
field (schema + migration + full backend/frontend wiring) rather than just
populating an existing free-text column. Treat that as a fresh feature, not
a revert of this decision:

1. Add categories for the new industry to `CATEGORIES` in `prisma/seed.ts`
   (or via the existing admin Category CRUD — `POST /categories`).
2. Add representative keywords to `POPULAR_KEYWORDS` in `hero-search.tsx`.
3. Update `src/app/layout.tsx` metadata and hero copy in
   `src/app/(main)/page.tsx` if the "IT" wording should become generic again.
4. Check `ICON_RULES` in `category-grid.tsx` covers the new category names.
5. Decide whether companies need an industry/sector field again, and if so
   add it back deliberately (schema + migration + DTOs + UI), rather than
   assuming the old free-text column is still there.
