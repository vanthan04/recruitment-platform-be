#!/usr/bin/env node
/**
 * Runs the e2e suite against an isolated test database instead of whatever
 * DATABASE_URL points to for local dev — without this, `npm run test:e2e`
 * writes real rows (companies, jobs, users) straight into the dev DB, which
 * is exactly how it got polluted with `*@e2e.test` accounts before.
 *
 * Loads `.env.test` (gitignored, same as `.env`) and lets its values win
 * over `.env`'s: dotenv only fills in keys that aren't already set, and this
 * runs before AppModule's ConfigModule loads `.env`, so `.env.test`'s
 * DATABASE_URL (and anything else it defines) takes priority while every
 * other var still falls back to `.env`.
 */
const path = require('path');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

const envTestPath = path.join(__dirname, '..', '.env.test');
const result = dotenv.config({ path: envTestPath });

if (result.error || !process.env.DATABASE_URL) {
  console.error(
    `Missing or incomplete .env.test at ${envTestPath}.\n` +
      'e2e tests need a database separate from local dev — copy ' +
      '.env.test.example to .env.test and point DATABASE_URL at a ' +
      'test-only database (a different database name on the same ' +
      'docker-compose postgres works fine).',
  );
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// `db push` (not `migrate deploy`) on purpose: it creates the target
// database if it doesn't exist yet and syncs the schema in one step, which
// is what an ephemeral test database wants — `migrate deploy` assumes the
// database already exists (it's meant for prod/CI, not first-run local test
// DBs) and would just fail here.
run('npx', ['prisma', 'db', 'push', '--accept-data-loss']);
// Registration (and anything else that connects a User to a Role by name)
// depends on the Roles/Permissions rows from prisma/seed.ts existing — a
// bare `db push` only creates the schema, not that reference data.
run('npx', ['prisma', 'db', 'seed']);
run('npx', ['jest', '--config', './test/jest-e2e.json']);
