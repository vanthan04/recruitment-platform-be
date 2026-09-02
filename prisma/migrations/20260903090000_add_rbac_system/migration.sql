-- ═════════════════════════════════════════════════════════════════════════
-- Database-driven RBAC: roles / permissions / role_permissions + users.roleId
--
-- Safety notes:
--   * This migration is purely ADDITIVE. It does not touch any unrelated
--     table and does not drop the legacy "users"."role" enum column, so
--     existing users, sessions and application code keep working unchanged.
--   * "users"."roleId" is added nullable first, backfilled from the existing
--     "role" enum for every current row, and only then set NOT NULL — no
--     user can end up without a valid role.
--   * A trigger keeps "roleId" automatically in sync whenever "role" is
--     written (register, admin role change, etc.), so no application code
--     has to change to keep the two columns consistent.
--   * The legacy "role" column is intentionally NOT dropped here. Drop it
--     only after verifying roleId data in your own environment — see the
--     manual follow-up migration this file documents at the bottom.
-- ═════════════════════════════════════════════════════════════════════════

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the exactly-3 roles that back the existing UserRole enum. Fixed ids
-- (rather than gen_random_uuid()) keep this migration deterministic and
-- independent of which Postgres extensions are installed. The idempotent
-- seed script (prisma/seed.ts) is the source of truth going forward; this
-- insert only exists so the roleId backfill below has rows to point at.
INSERT INTO "roles" ("id", "name", "description", "updatedAt") VALUES
    ('00000000-0000-0000-0000-000000000001', 'ADMIN', 'Platform administrator', CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000002', 'RECRUITER', 'Recruiter / company representative', CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000003', 'CANDIDATE', 'Job-seeking candidate', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- AlterTable: add roleId nullable first so existing rows can be backfilled
ALTER TABLE "users" ADD COLUMN "roleId" TEXT;

-- Backfill: map every existing users.role enum value to the matching role row.
-- ADMIN -> ADMIN role, RECRUITER -> RECRUITER role, CANDIDATE -> CANDIDATE role.
UPDATE "users" u
SET "roleId" = r."id"
FROM "roles" r
WHERE r."name" = u."role"::text;

-- Enforce NOT NULL now that every existing row has been backfilled
ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keep roleId in sync with the legacy role enum column so every existing
-- write path (register, admin "change user role", etc.) keeps working
-- without any application-code change while roleId remains correct.
CREATE OR REPLACE FUNCTION sync_users_role_id() RETURNS TRIGGER AS $$
BEGIN
  SELECT "id" INTO NEW."roleId" FROM "roles" WHERE "name" = NEW."role"::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_sync_role_id
BEFORE INSERT OR UPDATE OF "role" ON "users"
FOR EACH ROW EXECUTE FUNCTION sync_users_role_id();

-- ═════════════════════════════════════════════════════════════════════════
-- Manual down migration (Prisma Migrate has no automatic "migrate down";
-- documented here for anyone who needs to revert this migration by hand):
--
--   DROP TRIGGER IF EXISTS users_sync_role_id ON "users";
--   DROP FUNCTION IF EXISTS sync_users_role_id();
--   ALTER TABLE "users" DROP CONSTRAINT "users_roleId_fkey";
--   DROP INDEX "users_roleId_idx";
--   ALTER TABLE "users" DROP COLUMN "roleId";
--   DROP TABLE "role_permissions";
--   DROP TABLE "permissions";
--   DROP TABLE "roles";
--
-- The legacy "role" column is untouched by this migration, so reverting it
-- is a no-op — no user data is ever at risk from applying or reverting this
-- migration.
-- ═════════════════════════════════════════════════════════════════════════

-- ═════════════════════════════════════════════════════════════════════════
-- NEXT STEP (do NOT run until you have verified roleId data in your own
-- environment, per the task's migration-safety requirement — this is
-- intentionally a separate, manual step and is NOT part of this migration
-- file or applied automatically):
--
--   SELECT count(*) FROM "users" WHERE "roleId" IS NULL;              -- must be 0
--   SELECT u.id FROM "users" u JOIN "roles" r ON r.id = u."roleId"
--     WHERE r.name <> u."role"::text;                                  -- must be empty
--
-- Once both checks pass, drop the now-redundant legacy column with a new
-- migration:
--
--   DROP TRIGGER IF EXISTS users_sync_role_id ON "users";
--   DROP FUNCTION IF EXISTS sync_users_role_id();
--   ALTER TABLE "users" DROP COLUMN "role";
--   DROP TYPE "UserRole";
--
-- and remove the legacy `role` field from schema.prisma at the same time.
-- ═════════════════════════════════════════════════════════════════════════
