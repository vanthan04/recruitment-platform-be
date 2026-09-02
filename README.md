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
- **Chat** — realtime conversations between candidate and recruiter over WebSocket (Socket.IO), scoped to a job/application (`applicationId`/`jobId`); message send/edit/soft-delete, cursor-paginated history, read receipts, typing indicators, online presence, cookie-based WS auth, rate-limited send.
- **Interview scheduling** — recruiter schedules/reschedules/cancels an interview for a job application (in-person `location` and/or online `meetingLink`, at least one required); candidate is emailed on every change.

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | [NestJS 11](https://nestjs.com/) |
| ORM / DB | [Prisma 7](https://www.prisma.io/) (`@prisma/adapter-pg`) + PostgreSQL |
| Auth | `@nestjs/jwt`, `passport-jwt`, `bcrypt` |
| Validation | `class-validator` / `class-transformer` |
| Events | `@nestjs/event-emitter` (in-process pub/sub for notifications) |
| Scheduling | `@nestjs/schedule` (cron jobs) |
| Rate limiting | `@nestjs/throttler` |
| File storage | AWS S3 (`@aws-sdk/client-s3`) |
| Mail | `nodemailer` |
| PDF generation | `pdfkit` |
| Realtime | `socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io` |
| API docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Testing | Jest (unit) + Supertest (e2e) |

> Note: `uuid`, `@nestjs/event-emitter`, and `@nestjs/schedule` all ship pure-ESM releases in their latest majors, which Jest's CommonJS test runner cannot `require()`. This project uses `crypto.randomUUID()` instead of `uuid`, and pins `event-emitter`/`schedule` to their last CommonJS-compatible major versions — keep that in mind before bumping either package.

## Architecture

Every business module under `src/modules/<name>/` follows the same shape:

```
<module>/
├── domain/            # Entities, value objects, repository interfaces — no NestJS/Prisma imports
├── application/        # Use-cases (one class per business action), DTOs, mappers
├── infrastructure/      # Prisma repository implementations, persistence mappers, adapters, events
├── presentation/        # Controllers, request DTOs, guards/strategies (where relevant)
└── <module>.module.ts
```

Cross-cutting pieces live in `src/common/` (base entity, domain exceptions, pagination, decorators, guards, global exception filter) and `src/modules/prisma/` (the shared `PrismaService`).

For a deeper module-by-module breakdown, see **[CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md)**. For the feature history and what was built in what order, see **[ROADMAP.md](ROADMAP.md)**.

### Project structure

```
src/
├── common/          # Shared base entity, exceptions, guards, filters, decorators, pagination
├── modules/
│   ├── auth/            # JWT auth, refresh-token sessions, email verification, password reset
│   ├── user/             # Profile + admin user management
│   ├── company/          # Recruiter company profiles
│   ├── category/         # Job categories (admin-managed taxonomy)
│   ├── job/              # Job postings, search, lifecycle, view count
│   ├── cv/               # Structured CV, file upload, PDF export
│   ├── application/      # Job applications (apply/withdraw/status/stats)
│   ├── bookmark/         # Job bookmarks
│   ├── notification/     # In-app notifications
│   ├── job-alert/        # Saved searches + digest email cron
│   ├── file-upload/       # Generic S3 file upload
│   ├── mail/             # Mail provider (Nodemailer)
│   ├── chat/             # Realtime conversations/messages (Socket.IO gateway, presence)
│   ├── interview/         # Interview scheduling (schedule/reschedule/cancel, email candidate)
│   └── prisma/           # Shared PrismaService
└── main.ts          # Entry point (global prefix, CORS, validation pipe, exception filter)
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

### Installation

```bash
npm install
npx prisma generate
npx prisma db push   # this project uses `db push`, not migrations — no prisma/migrations folder
```

### Running

```bash
npm run start:dev    # watch mode
npm run start:prod   # production (run `npm run build` first)
```

Once running, Swagger docs are at `http://localhost:8080/api/v1/docs`.

### Testing

```bash
npm test        # unit tests (domain entities + use-cases)
npm run test:e2e  # end-to-end: register → verify → login → create company/job → create+publish CV → apply
```

The e2e suite runs against whatever `DATABASE_URL` you have configured and overrides the mail provider with a stub, so no real emails are sent.

## API Overview

All routes are prefixed with `/api/v1`. Resource roots:

`auth`, `users`, `admin/users`, `companies`, `categories`, `jobs`, `cvs`, `job-applications`, `bookmarks`, `notifications`, `saved-searches`, `files`, `conversations`, `messages`, `interviews`

Full request/response shapes are in Swagger at `/api/v1/docs`. Chat also has a WebSocket namespace (`/ws`) — see [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md) for the event list.

## License

MIT
