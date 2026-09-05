# Change Summary — September 2026 Refactor

Consolidated report for the 7-phase backend/frontend refactor executed 2026-09-05, covering CV
upload, application pipeline, job taxonomy, company scope, RBAC cleanup, auth token hardening, and
interview/notification polish. Written as the final deliverable requested alongside the original
refactor prompt — read this before touching any of the affected modules.

> See also: [API_GUIDE.md](API_GUIDE.md) (current API contract), [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md)
> (architecture), [docs/industry-expansion.md](docs/industry-expansion.md) (Company scope decision history).

---

## 1. Phase-by-phase summary

| Phase | Scope | Backend commit | Frontend commit |
|---|---|---|---|
| 1 | CV → file-only upload/download | `3584a89` | `aa4d072` |
| 2 | Application status pipeline (8 stages) | `269654b` | `05b6b64` |
| 3 | Job taxonomy split (EmploymentType/WorkMode) + Skill | `af1198c` (merged `1167d9d`) | `2e85c7d` |
| 4 | Company scope cleanup (`industry` removed) | `7aaa891` | `db11820` |
| 5 | RBAC legacy `role` column removal | `db1456b` | — (no FE change needed) |
| 6 | OAuth code + verification token hardening | `6fbcbab` | — (no FE change needed) |
| 7 | Interview complete/no-show + notification `readAt` | `2f8e705` | `1a0f668` |

All 7 phases pushed to `main` on both `recruitment-platform-be` and `recruitment-platform-fe`.

---

## 2. Data model changes

### Added
- `Skill`, `JobSkill` (Phase 3) — skill taxonomy, many-to-many with `Job`.
- `ApplicationStatusHistory` (Phase 2) — audit trail of every status transition (`fromStatus`,
  `toStatus`, `note`, `changedById`). **Written on every transition but has no read endpoint yet**
  (see §5).
- `VerificationToken` (Phase 6) — replaces `User.verifyCode`; `type` enum (`EMAIL_VERIFICATION` /
  `PASSWORD_RESET`) so the same column is no longer shared between two unrelated flows; stores a
  hash, not the plaintext code.
- `CvFileType` enum (`PDF`/`DOC`/`DOCX`), `EmploymentType`, `WorkMode` enums.
- `Cv.fileKey`, `fileType`, `mimeType`, `fileSize`, `originalName` (Phase 1).
- `InterviewSchedule.durationMinutes` (Phase 7).
- Indexes: `Job(status, createdAt)`, `Job(companyId, status)`, `Job(categoryId, status)`,
  `Job(status, expiresAt)` (Phase 3); `JobApplication(userId, createdAt)`,
  `JobApplication(jobId, status)` (Phase 2); `InterviewSchedule(jobApplicationId, scheduledAt)`
  (Phase 7).

### Removed
- `Cv.experiences` / `Cv.educations` / `Cv.skills` sub-entities, `Cv.summary`, `Cv.fileUrl`,
  `Cv.publishedAt` (Phase 1) — CV Builder is gone entirely, CV is a single uploaded file.
- `Company.industry` (Phase 4) — the platform has committed to IT-only scope permanently; see
  [docs/industry-expansion.md](docs/industry-expansion.md) for the reversal history.
- `User.role` enum column + `UserRole` Postgres enum + the `sync_users_role_id` DB trigger/function
  (Phase 5) — `User.roleId`/`roleRef` (the `Role` table) is now the single source of truth.
- `User.verifyCode` (Phase 6) — superseded by `VerificationToken`.
- `OauthLoginCode.accessToken` / `refreshToken` plaintext columns (Phase 6) — replaced with
  `userId` FK + `usedAt`; tokens are minted at exchange time instead of pre-minted and stored.
- `Notification.isRead` boolean column (Phase 7) — replaced by `readAt: DateTime?`.
- `pdfkit` dependency (Phase 1, no longer used once CV export was removed).

### Renamed / restructured
- `JobType` (`FULL_TIME/PART_TIME/CONTRACT/INTERNSHIP/REMOTE`) → split into two independent enums,
  `EmploymentType` (`FULL_TIME/PART_TIME/CONTRACT/INTERNSHIP`) and `WorkMode`
  (`ONSITE/HYBRID/REMOTE`) (Phase 3) — a job can now be e.g. `FULL_TIME` **and** `REMOTE`
  simultaneously, which the old single enum couldn't express.
- `ApplicationStatus`: `PENDING/ACCEPTED/REJECTED/WITHDRAWN` (4 values) →
  `APPLIED/SCREENING/SHORTLISTED/INTERVIEW/OFFER/HIRED/REJECTED/WITHDRAWN` (8 values), driven by a
  transition map in `application-status.vo.ts` instead of three ad-hoc entity methods (Phase 2).
- `InterviewStatus`: added `COMPLETED`, `NO_SHOW` alongside the existing
  `SCHEDULED/RESCHEDULED/CANCELLED` (Phase 7).

---

## 3. Migrations (in order, all hand-written SQL — see caveat in §7)

1. `20260905010000_refactor_cv_file_only` (Phase 1)
2. `20260905020000_application_pipeline` (Phase 2)
3. `20260905030000_job_taxonomy_and_skills` (Phase 3)
4. `20260905040000_remove_company_industry` (Phase 4)
5. `20260905050000_drop_legacy_user_role` (Phase 5)
6. `20260905060000_oauth_and_verification_tokens` (Phase 6)
7. `20260905070000_interview_notification_polish` (Phase 7)

---

## 4. Breaking API changes (client-visible)

- **CV**: `POST /cvs` is now `multipart/form-data` (`file` + `title`), not JSON. `PATCH /cvs/:id`
  only accepts `title`. `POST /cvs/:id/upload` and `GET /cvs/:id/export` are gone; `GET
  /cvs/:id/download` (new) returns `{ url, expiresAt }`, not a binary stream.
- **Job**: `jobType` replaced by `employmentType` + `workMode` on both `CreateJobDto` and the
  `GET /jobs` query. `skillIds?: string[]` added to create/update.
- **Job Application**: `ApplicationStatus` values changed entirely (old values no longer valid);
  `PATCH /job-applications/:id/status` body gained an optional `note`; chat conversation creation
  now requires `HIRED` instead of `ACCEPTED`.
- **Company**: `industry` removed from `CreateCompanyDto`/`UpdateCompanyDto`/search query — sending
  it is now silently ignored (extra fields stripped by the whitelist `ValidationPipe`).
- **Notification**: response field `isRead: boolean` replaced by `readAt: string | null`.
- **Interview**: two new routes (`PATCH /interviews/:id/complete`, `.../no-show`); response gained
  `durationMinutes`.
- **Auth/RBAC**: no client-visible change — JWT payload shape and every auth endpoint's request/
  response fields are identical; only the backing storage moved (DB columns → `Role`/
  `VerificationToken` tables).

Full endpoint-by-endpoint detail is in [API_GUIDE.md](API_GUIDE.md).

---

## 5. Intentionally NOT implemented

Per the original prompt's own guidance against over-engineering, and confirmed via this session's
review of actual usage in the codebase:

- **CV versioning** (multiple file versions per CV) — no current use case, adds complexity for no
  observed benefit.
- **AI-based CV parsing** — out of scope, no infrastructure for it exists.
- **Elasticsearch-backed search** — current Postgres `ILIKE`/index-based search is adequate at this
  scale; introducing a second data store would be premature.
- **`CompanyVerificationStatus`** (a "verified company" badge/flow) — no admin review process
  exists to back it; adding the field without the workflow would be a dead flag.
- **`InterviewType`** (`HR`/`TECHNICAL`/`FINAL`/`CODING`) — considered in Phase 7, deliberately
  skipped; nothing in the current UI or backend logic branches on interview type.
- ~~**`ApplicationStatusHistory` read endpoint**~~ — **closed, see §9**: `GET /job-applications/:id/history`.
- ~~**`skillIds` filter on `GET /jobs`**~~ — **closed, see §9**: job search now accepts `skillIds`.

---

## 6. Known follow-ups / pre-existing issues (flagged, not fixed)

- ~~**`POST /auth/register` allows self-selecting `role: "ADMIN"`**~~ — **closed, see §9**: restricted to `CANDIDATE`/`RECRUITER`.
- ~~**`Company.companyType`** not exposed on any DTO~~ — **closed, see §9**: wired into create/update/response, along with `province`/`ward`.
- ~~**`ApplicationStatusHistory` and skill-filtered job search**~~ — see §5, **both closed, see §9**.

---

## 7. Environment caveat — migrations were never applied to a live database

**No PostgreSQL instance was available in this sandboxed environment** (Docker Desktop's daemon
was not running), so none of the 7 migrations listed in §3 were ever run against a real database.
Each migration was hand-written to match Prisma's generated SQL conventions and validated only via
schema-only, no-DB-connection commands:

```bash
npx prisma validate
npx prisma generate
```

Before deploying any of this work, run the migrations for real and review each one — especially
Phase 4/5 (`remove_company_industry`, `drop_legacy_user_role`) which drop columns, and Phase 1/2
which reshape `Cv`/`ApplicationStatus` data:

```bash
npx prisma migrate deploy
```

All backend `npm run build` / `npm test` / `npm run lint` and frontend `npm run build` / `npm test`
/ `npm run lint` passes reported throughout this refactor were run and are real — only the
database-application step could not be exercised here.

---

## 8. Note on concurrent work

Multiple phases of this refactor (Phase 3, 4, 5) overlapped with commits from another active
session working on the same two repositories (a GitHub Copilot agent session pushing to
`recruitment-platform-be`, and uncommitted frontend WIP on onboarding/location/company-type
features). Every commit in this refactor was staged file-by-file (never `git add -A`) to avoid
capturing that other session's in-progress work, and `git fetch`/merge was run before every push to
pick up its changes cleanly. If anything in this repository looks unfinished around
`companyType`, onboarding, or province/ward address fields, that is the other session's WIP, not a
gap in this refactor.

---

## 9. Addendum — hardening pass, OAuth, and a follow-up business-logic review (2026-09-05, later commits)

Everything above this line was the original 7-phase refactor. The same day, later commits closed
the gaps this document had flagged and shipped a feature that wasn't part of the original scope:

- **`fix: harden business rules found in schema/logic review`** (`c5f5e35`) — salary range now
  throws `BusinessRuleViolationException` (400) instead of a raw `Error` (500); interview
  schedule/reschedule/cancel/complete/no-show reject applications already at a terminal status
  (`HIRED`/`REJECTED`/`WITHDRAWN`); deleting a CV referenced by a non-terminal application is now
  blocked instead of silently breaking recruiter downloads; added the daily
  expired-token-cleanup cron; closed every §5/§6 gap listed above (`companyType`/`province`/`ward`
  DTO wiring, `ApplicationStatusHistory` read endpoint, `skillIds` filter on `GET /jobs`, ADMIN
  self-registration); replaced `Job.extraInfo` (untyped JSON) with typed `workingHours`/
  `applicationMethod` columns.
- **`feat(auth): implement Google/Facebook OAuth login`** (`97feff5`) — see
  [API_GUIDE.md](API_GUIDE.md) §2 for the flow (one-time exchange code via `POST
  /auth/social/exchange`, never a token in a redirect URL). The design doc this was built from
  (`GOOGLE_FACEBOOK_LOGIN_PLAN.md`, repo root one level up) has been deleted now that it's shipped —
  API_GUIDE.md is the current reference.
- **A follow-up business-logic review** (this session) found and fixed 4 more gaps, none overlapping
  the above: `InterviewSchedule.cancel()`/`reschedule()` had their own terminal-status guard
  independent of the application-status guard `c5f5e35` added, and it only blocked `CANCELLED` —
  not `COMPLETED`/`NO_SHOW` — so a recruiter could still cancel or reschedule an interview that had
  already happened; `GET /jobs` search didn't filter `expiresAt`, so an expired-but-not-yet-cron-closed
  job stayed visible in search for up to an hour; `Company.ownerId` had no DB-level uniqueness behind
  the "1 active company per recruiter" rule (now a partial unique index, migration
  `20260905090000_company_owner_active_unique`); `GlobalExceptionFilter` didn't recognize a Prisma
  `P2002` unique-constraint error, so any check-then-insert race (double-apply, double-create-company)
  surfaced as a raw 500 instead of `409 DUPLICATE_ENTITY`. See `CODEBASE_SUMMARY.md` for where each
  fix lives.
- `ROADMAP.md` has been deleted — every phase in it was already marked done and several details
  (AWS Lambda deploy, a CV builder/export use-case) describe designs since reverted or removed
  entirely. This document and `CODEBASE_SUMMARY.md` are the sources of truth for history and current
  state, respectively.
