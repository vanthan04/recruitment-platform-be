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
- **`ApplicationStatusHistory` read endpoint** — the table is written on every transition (so the
  data exists and costs nothing to add later), but no route/query exposes it yet. This is a gap,
  not a design decision — flagged as a follow-up in §6, not silently dropped.
- **`skillIds` filter on `GET /jobs`** — `Skill`/`JobSkill` exist and are settable at job
  create/update time, but job search does not yet filter by skill. Same category as above: a real
  gap worth closing next, not an intentional omission.

---

## 6. Known follow-ups / pre-existing issues (flagged, not fixed)

- **`POST /auth/register` allows self-selecting `role: "ADMIN"`** with no gating — this predates
  this refactor and was out of scope to fix here (touching registration security deserves its own
  reviewed change, not a drive-by inside an unrelated refactor). Frontend should hide the ADMIN
  option from any public registration form.
- **`Company.companyType`** (`PRODUCT`/`OUTSOURCING`/`STARTUP`/`CONSULTING`) exists at the DB level
  but is not exposed on any Company DTO. This appears to be in-progress work from a separate,
  concurrently active session on this same repository (encountered mid-refactor — see the note
  below) rather than something this refactor should finish. `docs/industry-expansion.md` documents
  the current state.
- **`ApplicationStatusHistory` and skill-filtered job search** — see §5, both are real gaps worth a
  small follow-up PR rather than silent omissions.

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
