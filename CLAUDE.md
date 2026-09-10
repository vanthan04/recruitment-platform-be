# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

NestJS backend for a job portal (IT recruitment only — no multi-industry `industry` field by design). Candidates apply to jobs, recruiters post jobs and manage applicants. PostgreSQL via Prisma. Built as **Clean Architecture / DDD**: every business module is split into `domain / application / infrastructure / presentation` layers.

This repo is one of three sibling repos that make up the platform:
- `recruitment-platform-fe` (Next.js frontend, calls this API server-side)
- `recruitment-platform-edge` (Cloudflare Worker, proxies `/socket.io/*` from the FE's domain to this backend in production)

## Commands

```bash
npm install
docker compose up -d          # local Postgres matching .env.example
npx prisma generate
npx prisma migrate deploy
npm run db:seed               # seeds RBAC roles/permissions — required, auth depends on it

npm run start:dev             # watch mode, http://localhost:8080
npm run build && npm run start:prod

npm run lint                  # eslint --fix over src/apps/libs/test
npm run format                # prettier --write src/test

npm test                                        # unit tests (jest, rootDir=src)
npx jest path/to/file.spec.ts                   # single unit test (path relative to src/)
npx jest --coverage
npm run test:e2e              # spins up scripts/run-e2e-tests.js — see below
```

Swagger docs at `http://localhost:8080/api/v1/docs` once running.

### e2e tests

`npm run test:e2e` runs `scripts/run-e2e-tests.js`, which:
1. Loads `.env.test` (gitignored — create it yourself with a `DATABASE_URL` pointing at a **separate** database from dev; the same docker-compose Postgres with a different DB name is fine)
2. Runs `prisma db push --accept-data-loss` (not `migrate deploy` — creates the DB if missing) then `prisma db seed`
3. Runs `jest --config ./test/jest-e2e.json`

Without `.env.test` this refuses to run rather than writing test data into your dev database. Mail is stubbed in e2e — no real email is sent.

## Architecture

Every module under `src/modules/<name>/` follows the same shape:

```
<module>/
├── domain/            # Entity, value objects, repository interfaces, domain exceptions — no NestJS/Prisma imports
├── application/        # Command/Query + Handler pairs (@nestjs/cqrs), DTOs, mappers, ports (interfaces for cross-module deps)
├── infrastructure/      # Prisma repository impls, persistence mappers, adapters (implement this module's ports, usually by wrapping another module's domain repository interface)
├── presentation/        # Controllers, request DTOs, guards/strategies
└── <module>.module.ts
```

- Business logic lives in domain entities, not in handlers or services — domain layer has zero framework dependencies.
- Every write/read action is a `Command`/`Query` + one `Handler`, dispatched through `CommandBus`/`QueryBus` (`@nestjs/cqrs`). This is a mid-2026 refactor — legacy `*.use-case.ts` naming is gone in favor of `*.command.ts`/`*.query.ts` + `*.handler.ts`.
- Cross-module reads go through a `Port` interface defined in the *consuming* module's `application/ports/`, implemented by an `infrastructure/adapters/*` that wraps the *other* module's domain repository — modules never import each other's Prisma models directly.
- Shared code lives in `src/common/`: `domain/base.entity.ts` (base entity), `exceptions/domain.exception.ts` (base domain exception), `guards/` (`JwtAuthGuard`, `PermissionGuard`, OAuth guards), `decorators/` (`@RequirePermissions`, `@GetMe`), plus pagination, filters, and `config/` (env validation via Joi, pino logger config).
- RBAC: every controller route declares required permissions via `@RequirePermissions`, enforced by `PermissionGuard` (DB-backed `roles`/`permissions`/`role_permissions`, cached — permission changes don't need a redeploy).
- Cron jobs live at `application/jobs/` inside the owning module (e.g. `job/application/jobs/close-expired-jobs.cron.ts`, `job-alert/application/jobs/job-alert-digest.cron.ts`) and rely on the app running as a single long-lived process (no external scheduler needed) — this shapes the EC2 deployment choice over Lambda.
- Logging: `nestjs-pino`, structured JSON, one `requestId` ties access log + app logs + error log for a request together; secrets (passwords, tokens, auth headers/cookies) are auto-redacted.

See [README.md](README.md) for the full feature list and API resource map, [API_GUIDE.md](API_GUIDE.md) for per-resource request/response shapes, and [DEPLOY.md](DEPLOY.md) for the EC2/Docker deploy process. **[CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md) is a self-maintained audit doc that lags behind the actual code** (e.g. its test counts and some "known gaps" are stale) — treat it as a starting pointer, not ground truth; verify anything load-bearing against the source or README before repeating it.

## Notes

- `uuid`'s latest version is pure-ESM and Jest (CommonJS) can't `require()` it — the codebase uses `crypto.randomUUID()` instead. Don't reintroduce `uuid`.
- Company uniqueness (one active company per recruiter) is enforced at the DB level via a partial unique index on `ownerId`, not application code — this lets soft-delete-then-recreate work correctly.
- `GET /jobs` search filters out jobs past `expiresAt` even though a job's `status` field is only flipped to `CLOSED` by an hourly cron — don't rely on `status === 'OPEN'` alone to mean "still applyable."
- Test files (`*.spec.ts`, `test/**/*.ts`) have several `@typescript-eslint` rules relaxed (`unbound-method`, `no-unsafe-*`, `require-await`) — this is deliberate for mock/fixture patterns, not laxness to copy into `src/`.
