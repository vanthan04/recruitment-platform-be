import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // Only the Prisma CLI (migrate/introspect/studio) reads this config —
    // the running app connects via PrismaPg in prisma.service.ts using
    // DATABASE_URL directly, so this doesn't affect app runtime at all.
    // Prefer DIRECT_URL when set: Migrate needs a session-level advisory
    // lock that a pooled connection (Neon's "-pooler" host, or any
    // PgBouncer-fronted DB in transaction mode) can't provide. Falls back
    // to DATABASE_URL when DIRECT_URL is unset (e.g. local docker-compose
    // Postgres, which has no pooler in front of it).
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
});
