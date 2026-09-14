import { Prisma } from '@prisma/client';

/**
 * True for a P2002 unique-constraint violation — the error a check-then-
 * insert race surfaces once the DB's own unique constraint catches what the
 * application-layer check missed (see apply-job.command.ts /
 * create-company.command.ts, both of which have this exact race window).
 */
export function isUniqueConstraintViolation(
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}

/**
 * The name of the specific constraint/index a P2002 violated — needed
 * whenever a table has more than one unique constraint and a caller must
 * tell them apart (e.g. create-company.command.ts's `companies_slug_key`
 * vs. its `companies_owner_id_active_unique` partial index — conflating
 * the two previously reported every slug collision as "you already own a
 * company", which is false).
 *
 * This app uses `@prisma/adapter-pg` (see PrismaModule), whose P2002
 * reports the violated constraint at
 * `meta.driverAdapterError.cause.constraint.index` — verified empirically
 * against this exact Prisma 7 / adapter-pg combination (not documented
 * anywhere; the classic query-engine shape, `meta.target` as a column-name
 * array, does not apply here). That classic shape is still checked as a
 * fallback in case the driver ever changes back.
 */
export function uniqueConstraintName(
  err: Prisma.PrismaClientKnownRequestError,
): string | undefined {
  const meta = err.meta as
    | {
        driverAdapterError?: {
          cause?: { constraint?: { index?: string } };
        };
        target?: string[] | string;
      }
    | undefined;

  const adapterIndex = meta?.driverAdapterError?.cause?.constraint?.index;
  if (adapterIndex) return adapterIndex;

  const target = meta?.target;
  return Array.isArray(target) ? target.join(',') : target;
}
