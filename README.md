# Job Portal Backend (Recruitment Platform)

A job portal backend (candidates apply for jobs, recruiters post and manage them) built with **NestJS**, **Prisma**, and **PostgreSQL**, following **Domain-Driven Design (DDD)** and **Clean Architecture** — each module is split into `domain / application / infrastructure / presentation` layers, with framework-agnostic business logic living in domain entities.

## Features

- **Auth** — JWT access + refresh tokens, email verification, forgot/reset password, multi-device sessions (each login gets its own revocable refresh token), logout (current device) / logout-all (every device), rate-limited login/register/forgot-password.
- **User** — profile management, admin user list + status/role management.
- **Company** — recruiters own a company profile (logo, industry, size, address); a recruiter must have a company before posting jobs.
- **Category** — admin-managed job categories for search filtering; jobs can also carry a seniority `level` (INTERN → MANAGER).
- **Job** — CRUD, public search (keyword/location/type/level/category/salary/company), lifecycle (`DRAFT → OPEN → CLOSED`) with manual close/reopen and an hourly cron that auto-closes expired postings, per-job view count.
- **CV** — structured CV (experience/education/skills) with publish workflow, upload a ready-made file (PDF/DOC/DOCX), export the structured CV to PDF.
- **Application** — apply to a job with a published CV, list mine / list by job (recruiter), update status (accept/reject), withdraw a pending application, per-job stats (view count + status breakdown) for recruiters.
- **Bookmark** — candidates bookmark/unbookmark jobs.
- **Notification** — in-app notifications (new application → recruiter, status change → candidate), mark as read / read all.
- **Job Alert** — candidates save a search; a daily cron emails a digest of newly posted jobs matching it.
- **File upload** — generic image/document upload to S3-compatible storage, with size and MIME-type validation.
- **Admin** — list/paginate users, update user status or role.
- **RBAC (Permission)** — database-driven role → permission mapping (`roles`/`permissions`/`role_permissions`); every controller route declares required permissions via `@RequirePermissions`, checked by `PermissionGuard` (cached, no redeploy needed to change what a role can do); admin endpoints to list roles/permissions and replace a role's permission set.
- **Chat** — realtime conversations between candidate and recruiter over WebSocket (Socket.IO), scoped to a job/application (`applicationId`/`jobId`); message send/edit/soft-delete, cursor-paginated history, read receipts, typing indicators, online presence, cookie-based WS auth, rate-limited send.
- **Interview scheduling** — recruiter schedules/reschedules/cancels an interview for a job application (in-person `location` and/or online `meetingLink`, at least one required); candidate is emailed on every change.

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | [NestJS 11](https://nestjs.com/) |
| ORM / DB | [Prisma 7](https://www.prisma.io/) (`@prisma/adapter-pg`) + PostgreSQL |
| Application layer | `@nestjs/cqrs` — one `Command`/`Query` + one `Handler` per business action, dispatched through `CommandBus`/`QueryBus` |
| Auth | `@nestjs/jwt`, `passport-jwt`, `bcrypt` |
| Authorization | Database-driven RBAC (`PermissionGuard` + `@RequirePermissions`, see `permission` module) |
| Validation | `class-validator` / `class-transformer` |
| Events | `@nestjs/event-emitter` (in-process pub/sub for notifications) |
| Scheduled jobs | `@nestjs/schedule` (`@Cron`) — in-process, one class per job under each module's `application/jobs/` |
| Rate limiting | `@nestjs/throttler`, default in-memory `ThrottlerStorage` |
| Logging | `nestjs-pino` / `pino-http` — structured JSON logs, one `requestId` tying together the access log line, every app log, and the error log for a request; secrets (passwords, tokens, auth headers/cookies) redacted; pretty-printed in dev, JSON in production |
| Deployment | One always-on AWS EC2 instance running the Docker image — see [`DEPLOY.md`](DEPLOY.md) and the separate `recruitment-platform-infra` repo (Terraform) |
| File storage | AWS S3 (`@aws-sdk/client-s3`) |
| Mail | `nodemailer` |
| PDF generation | `pdfkit` |
| Realtime | `socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io` |
| API docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Testing | Jest (unit) + Supertest (e2e) |

> Note: `uuid` ships a pure-ESM release in its latest major, which Jest's CommonJS test runner cannot `require()` — this project uses `crypto.randomUUID()` instead.

## Architecture

Every business module under `src/modules/<name>/` follows the same shape:

```
<module>/
├── domain/            # Entities, value objects, repository interfaces, per-module exceptions — no NestJS/Prisma imports
├── application/        # Commands/Queries + Handlers (@nestjs/cqrs, one per business action), DTOs, mappers, ports
├── infrastructure/      # Prisma repository implementations, persistence mappers, adapters (implement this module's ports, often by wrapping another module's repository interface), events
├── presentation/        # Controllers, request DTOs, guards/strategies (where relevant)
└── <module>.module.ts
```

Cross-cutting pieces live in `src/common/` (base entity, domain exceptions, pagination, decorators, guards, global exception filter) and `src/modules/prisma/` (the shared `PrismaService`).

For a deeper module-by-module breakdown, see **[CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md)**. For the feature history and what was built in what order, see **[ROADMAP.md](ROADMAP.md)**.

### Project structure

```
src/
├── common/          # Shared base entity, exceptions, guards, filters, decorators, pagination,
│                    # config/ (env validation, pino logger)
├── modules/
│   ├── auth/            # JWT auth, refresh-token sessions, email verification, password reset
│   ├── user/             # Profile + admin user management
│   ├── permission/        # Database-driven RBAC (roles/permissions/role_permissions), admin endpoints
│   ├── company/          # Recruiter company profiles
│   ├── category/         # Job categories (admin-managed taxonomy)
│   ├── job/              # Job postings, search, lifecycle, view count, application/jobs/ (hourly close-expired-jobs cron)
│   ├── cv/               # Structured CV, file upload, PDF export
│   ├── application/      # Job applications (apply/withdraw/status/stats)
│   ├── bookmark/         # Job bookmarks
│   ├── notification/     # In-app notifications
│   ├── job-alert/        # Saved searches; application/jobs/ (daily digest cron)
│   ├── file-upload/       # Generic S3 file upload
│   ├── mail/             # Mail provider (Nodemailer)
│   ├── chat/             # Realtime conversations/messages (Socket.IO gateway, presence)
│   ├── interview/         # Interview scheduling (schedule/reschedule/cancel, email candidate)
│   └── prisma/           # Shared PrismaService
├── bootstrap.ts      # Shared Nest app setup (helmet, prefix, validation pipe, Swagger, pino logger,
│                    # exception filter) used by main.ts
└── main.ts           # Server entry point (npm run start:dev / start:prod)
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (local install or any reachable instance)

### Environment variables

Create a `.env` file in the project root:

| Variable | Required | Notes |
|---|---|---|
| `PORT` | no (default `8080`) | HTTP port |
| `DATABASE_URL` | yes | `postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public` |
| `CORS_ORIGIN` | no | Comma-separated allowed origins; omit to reflect any origin (dev-friendly default) |
| `JWT_SECRET` / `JWT_EXPIRATION` | yes | Access token signing |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRATION` | yes | Refresh token signing |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USER` / `MAIL_PASS` / `MAIL_FROM` | yes | SMTP for verification/reset/job-alert emails |
| `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | yes | File storage |
| `S3_ENDPOINT` | no | Set for S3-compatible providers (e.g. MinIO, R2) |
| `LOG_LEVEL` | no (default `debug` in dev, `info` in prod) | `fatal`/`error`/`warn`/`info`/`debug`/`trace`/`silent` |

### Installation

```bash
npm install
docker compose up -d   # starts a local Postgres matching .env.example
npx prisma generate
npx prisma migrate deploy
npm run db:seed        # seeds RBAC roles/permissions
```

### Running

```bash
npm run start:dev    # watch mode
npm run start:prod   # production (run `npm run build` first)
```

Once running, Swagger docs are at `http://localhost:8080/api/v1/docs`.

### Deployment

Production runs as a Docker container on a single always-on **AWS EC2**
instance — the same `src/main.ts` entry point as local dev, just built
via the `Dockerfile` and deployed by `.github/workflows/deploy.yml`. See
[`DEPLOY.md`](DEPLOY.md) for the full setup, and the separate
`recruitment-platform-infra` repo for the Terraform that provisions the
instance, ECR repo, S3 uploads bucket, and SSM Parameter Store entries.

Scheduled jobs (`close-expired-jobs.cron.ts`, `job-alert-digest.cron.ts`)
and rate limiting both rely on being one persistent process — no
external coordination (DynamoDB, EventBridge) needed, unlike a
Lambda-based deploy.

### Testing

```bash
npm test        # unit tests (domain entities + command/query handlers) — 85 tests / 14 suites currently
npm run test:e2e  # end-to-end: register → verify → login → create company/job → create+publish CV → apply; chat flow
```

The e2e suite runs against whatever `DATABASE_URL` you have configured and overrides the mail provider with a stub, so no real emails are sent.

## API Overview

All routes are prefixed with `/api/v1`. Resource roots:

`auth`, `users`, `admin/users`, `admin/roles`, `admin/permissions`, `companies`, `categories`, `jobs`, `cvs`, `job-applications`, `bookmarks`, `notifications`, `saved-searches`, `files`, `conversations`, `messages`, `interviews`

Full request/response shapes are in Swagger at `/api/v1/docs`. Chat also has a WebSocket namespace (`/ws`) — see [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md) for the event list.

## License

MIT
