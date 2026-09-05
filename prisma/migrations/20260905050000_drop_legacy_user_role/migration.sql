-- Phase 5: drop the legacy `users.role` enum column, its sync trigger, and
-- the `UserRole` DB enum type — `roleId`/`roleRef` (User -> Role) is now the
-- single source of truth for a user's role. Documented as the intended
-- follow-up in prisma/migrations/20260903090000_add_rbac_system/migration.sql.
--
-- Before applying against a database with real data, verify (per that
-- migration's own guidance) that this is safe:
--   SELECT count(*) FROM "users" WHERE "roleId" IS NULL;              -- must be 0
--   SELECT u.id FROM "users" u JOIN "roles" r ON r.id = u."roleId"
--     WHERE r.name <> u."role"::text;                                  -- must be empty
-- Both checks trivially pass here since the trigger being dropped kept
-- roleId in sync with role on every write.

DROP TRIGGER IF EXISTS users_sync_role_id ON "users";
DROP FUNCTION IF EXISTS sync_users_role_id();
ALTER TABLE "users" DROP COLUMN "role";
DROP TYPE "UserRole";
