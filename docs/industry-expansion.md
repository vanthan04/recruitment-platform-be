# Industry scope: current decision and how to expand later

## Current decision

The platform is scoped to **IT recruitment only** (not a multi-industry job
board). This was a deliberate product decision to keep the personal-project
scope small and shippable, not a technical limitation.

## Why this didn't require a schema change

The data model was already industry-agnostic before this decision, and stays
that way:

- `Category` (`prisma/schema.prisma`) only has `name` and `slug` — free text,
  not an enum. It's just "whatever categories exist right now."
- `Company.industry` (`prisma/schema.prisma`) is a free-text string, not an
  enum or a foreign key to a fixed list.

So narrowing to IT was a **content/copy change**, not an architecture change:

- `prisma/seed.ts` — the `CATEGORIES` seed list currently contains only IT
  roles (Frontend, Backend, DevOps, QA, Mobile, Data/AI, Security, BA/Product,
  UI/UX, IT Support).
- `recruitment-platform-fe/src/components/home/hero-search.tsx` —
  `POPULAR_KEYWORDS` currently lists IT roles only.
- `recruitment-platform-fe/src/app/layout.tsx` and
  `src/app/(main)/page.tsx` — site metadata and hero copy mention "IT"
  explicitly.
- `recruitment-platform-fe/src/components/home/category-grid.tsx` —
  `ICON_RULES` already has entries for non-IT categories (kế toán, marketing,
  y tế, xây dựng, ...) left in place from before this decision; they're
  inert today (no such categories exist) but need no changes to work again.

## Non-goals (guardrails against re-locking the scope)

Don't do these when working in this area, even if it looks like a
simplification:

- Don't turn `Category.name`/`slug` into an enum.
- Don't turn `Company.industry` into an enum or a foreign key to a fixed
  category list.
- Don't add backend logic that filters/validates as if "IT" were the only
  possible value (e.g. rejecting a company because `industry` isn't tech).
- Don't delete the non-IT `ICON_RULES` entries in `category-grid.tsx` — they
  cost nothing to keep and save the work of re-adding them later.

## Checklist: adding a second industry later

1. Add categories for the new industry to `CATEGORIES` in
   `prisma/seed.ts` (or create them via the existing admin Category CRUD —
   `POST /categories`) and run the seed/migration as usual. No schema change
   needed.
2. Add representative keywords for the new industry to
   `POPULAR_KEYWORDS` in `hero-search.tsx` (or make it multi-industry aware
   if the keyword list grows past a handful of hardcoded items).
3. Update `src/app/layout.tsx` metadata and the hero copy in
   `src/app/(main)/page.tsx` if the "IT" wording should become generic again
   (e.g. "Nền tảng tuyển dụng" instead of "Nền tảng tuyển dụng ngành IT").
4. Check `ICON_RULES` in `category-grid.tsx` covers the new category names;
   most non-IT industries were already covered before the IT-only pivot.
5. Nothing to change in `Company.industry` — recruiters already enter it as
   free text (e.g. the placeholder in `company-form.tsx` can be broadened
   past tech examples if it starts looking IT-only).
