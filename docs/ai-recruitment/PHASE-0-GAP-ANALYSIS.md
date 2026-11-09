# Phase 0 — Gap Analysis (YOLO Interview Monitoring)

**Date:** 2026-11-09 · **Scope:** read-only review of `recruitment-platform-be` and `recruitment-platform-fe`. No application code was changed.
**Compared against:** the "IT Recruitment Platform + YOLO AI Interview Monitoring — Implementation Plan v1.0".

## 1. Headline findings

1. **Interview management (Phase 1) is already largely built.** The plan assumes it must be created from scratch; the repo has a working `interview` module, UI and reminder cron. Phase 1 shrinks from "build" to "close specific gaps" (§4).
2. **The repo layout differs from the plan.** There are two independent repos (BE + FE), no `apps/` monorepo and no AI service. Do not restructure; add the AI service as a third deployable.
3. **The browser never calls the backend for REST.** The FE uses a `server-only` API client (BFF). Frame upload cannot follow the existing FE service pattern unchanged (§5).
4. **The global rate limit will block the plan's frame rate.** Default is 60 req/60 s per client; 1–3 fps is 60–180 req/min.
5. **Open product question:** interviews run over an external `meetingLink` / `location`. There is no in-platform video room, so where the candidate's webcam is analysed needs a decision (§7).

## 2. Current architecture (verified from source)

| Area | Reality |
|---|---|
| Repos | `recruitment-platform-be` (NestJS 11, Prisma 7, Postgres, Redis, Railway) and `recruitment-platform-fe` (Next 15.5, React 19, Vercel). Each has its own `.git`; the parent folder is not a repo. |
| BE style | Clean Architecture/DDD + CQRS (`@nestjs/cqrs`): `domain / application / infrastructure / presentation` per module; cross-module reads via `Port` + adapter. Controllers use `JwtAuthGuard` + `PermissionGuard` + `@RequirePermissions`. |
| Authz | DB-backed RBAC (`roles`, `permissions`, `role_permissions`), roles `ADMIN / RECRUITER / CANDIDATE`, seeded by `prisma/seed.ts` (wired on first run only per role). Ownership is checked in handlers against `job.postedById` / `application.userId`, never client-supplied IDs. |
| Realtime | `ChatGateway` (Socket.IO, namespace `/ws`) authenticates from the httpOnly `access_token` cookie, joins `user:<id>` rooms, listens to `USER_SESSION_REVOKED_EVENT`. Browser connects straight to the backend origin; CORS allowlist + `sameSite:none; secure` cookie. |
| Existing "AI" | `modules/ai` is LLM/LangChain based (CV analysis, matching, screening, job draft). It is unrelated to computer vision and should stay separate. |
| Deploy | BE: single always-on Railway container (crons depend on it). FE: Vercel. No Python anywhere in either repo. |
| Tooling | Python 3.13.15 is installed locally. Ultralytics/PyTorch wheel support for 3.13 was **not** verified; pin the AI service's Docker image to 3.11/3.12 unless confirmed. |

## 3. Plan vs. repo — mismatches

| Plan says | Repo has | Decision |
|---|---|---|
| Entities `Interview`, `InterviewParticipant`, `InterviewSession`, `InterviewFeedback` | One model `InterviewSchedule` (`scheduledAt, durationMinutes, location, meetingLink, note, status, reminderSentAt, createdById`) FK → `JobApplication` | Keep `InterviewSchedule`. Add only what is missing (a session), do not rename. |
| `InterviewParticipant` | Participants are implicit: candidate = `application.userId`, recruiter = `job.postedById`. One recruiter per job; no panel interviewers. | Do not add a participant table for MVP. |
| `InterviewFeedback` | `ApplicationNote` (recruiter-private notes, add/delete) | Reuse; no new feedback model. |
| `/interviews` REST set (`GET /interviews`, `GET /:id`, `POST /:id/start`, `POST /:id/complete`, `GET /:id/sessions`) | `POST /interviews`, `PATCH /:id` (reschedule), `PATCH /:id/cancel`, `PATCH /:id/complete`, `PATCH /:id/no-show`, `GET /interviews/application/:applicationId` | Keep existing verbs/paths (FE depends on them). Add the missing reads. |
| Statuses | `SCHEDULED, RESCHEDULED, COMPLETED, CANCELLED, NO_SHOW` | No `IN_PROGRESS`. Session state should live on the new session record, not by overloading this enum. |
| Roles: Candidate, Recruiter, Admin | Same. `ADMIN` has **no** interview permissions in the seed. | Leave as is unless admin access to monitoring is wanted. |
| Auth: JWT + Google OAuth | Present (cookie JWT, refresh, OAuth guards) | Reuse. |
| `apps/web`, `apps/api`, `apps/ai-service` | Two separate repos | Keep; place `ai-service` as a sibling folder/repo. |

## 4. Interview Management — what exists vs. what is missing

**Exists (backend):** schedule, reschedule, cancel, complete, no-show, list-by-application; domain rules (cannot reschedule cancelled, time not in past, location-or-link required, one active interview per application, application must not be HIRED/REJECTED/WITHDRAWN); owner checks via `ensureOwner`; candidate-or-owner read check; 24 h / 2 h reminder email cron with claim marker; unit specs for each command and the entity.
**Exists (frontend):** recruiter `interview-dialog` + `interview-panel` inside the application board; candidate sees the interview inline on `/applications` via `InterviewInfo`.

**Missing for the monitoring feature:**

| # | Gap | Why it matters |
|---|---|---|
| G1 | No `GET /interviews/:id` | Interview-room and report pages need a single-interview read with participant authorization. |
| G2 | No cross-application list (`GET /interviews`, paginated, role-scoped) | Plan requires recruiter list/calendar and candidate "upcoming". Candidate page currently issues one request per application (N+1). |
| G3 | No session concept (`startedAt`, `endedAt`, per-run state) | Detection events must attach to a session; `complete` is recruiter-only and there is no "start" at all. |
| G4 | No candidate action (join/start/consent) | Today only recruiters can mutate interviews. |
| G5 | No interview-room page in FE | Nothing hosts the webcam/consent UI. |
| G6 | No `getUserMedia` usage anywhere in the FE | Entire webcam lifecycle is new code. |
| G7 | No e2e coverage for interviews (`test/` has ai-matching, auth, chat, jobs-applications) | Phase 1 changes should add one. |
| G8 | Consent / monitoring audit record does not exist | Needed before any frame is processed. |

Recommended Phase 1 scope: G1, G2, G3 (new `InterviewSession` model + start/end by authorized participants), G7. G4/G5/G8 belong to Phases 3–4 because they are monitoring-specific.

## 5. Integration risks specific to this codebase

1. **BFF pattern vs. frame upload.** All FE REST goes through server-only `lib/api`. Posting 1–3 images/s through a Server Action or Route Handler adds a hop and hits body-size limits. Options: (a) browser → NestJS directly with the existing cross-origin cookie (as the chat socket already does), or (b) send frames over a dedicated Socket.IO event. Needs a deliberate choice in Phase 3; either satisfies "no browser → AI service direct".
2. **Global throttle.** `ThrottlerModule`: `ttl 60000`, `limit 60` (`GLOBAL_THROTTLE_LIMIT`). The frame endpoint needs its own bounded limit (e.g. per-session) rather than raising the global one.
3. **No body-size limits configured** in `bootstrap.ts`/`main.ts` for uploads; frame endpoint must enforce its own max size and content type.
4. **Gateway reuse.** Reuse `authenticateSocket` and the `user:<id>` room pattern; add a new `interview-session:<id>` room authorized per session. Handle `USER_SESSION_REVOKED_EVENT` like chat does.
5. **Prisma migrations.** Repo uses timestamped `prisma/migrations` + `migrate deploy`; e2e uses `db push`. New models need both a migration and an e2e check. Follow the FK convention used here (`SetNull` for attribution, `Restrict`/`Cascade` documented in the schema comments) and avoid cascading deletes of hiring history.
6. **Single-instance assumption.** Crons and in-memory presence assume one BE process; per-session event dedup state (cooldown) must live in Redis or the DB if the BE is ever scaled.
7. **AI service hosting.** Railway services are Docker-based, so a second Railway service with a private-network URL fits; CPU capacity must come from the Phase 2 benchmark.

## 6. Proposed Phase 1 checklist (Interview Management, minimal)

- [ ] Prisma: add `InterviewSession` (`id, interviewId FK, startedAt, endedAt?, status, createdAt`) + indexes `(interviewId)`, `(interviewId, startedAt)`; one migration. No change to `InterviewSchedule` unless required.
- [ ] Domain/application: `StartInterviewSession`, `EndInterviewSession` commands with transition rules (interview must be `SCHEDULED/RESCHEDULED`, no concurrent open session, allowed only for the candidate or the job-owning recruiter); `GetInterview`, `ListMyInterviews` (paginated, role-scoped) queries; port methods added to the existing lookup ports.
- [ ] Presentation: `GET /interviews/:id`, `GET /interviews`, `POST /interviews/:id/sessions/start`, `POST /interviews/:id/sessions/:sessionId/end`, `GET /interviews/:id/sessions`; new permission strings only if existing `interview:*` are insufficient (seed is first-run-only per role, so existing DBs need an explicit grant step).
- [ ] Tests: entity/handler unit specs for every new rule; one e2e covering cross-recruiter and cross-candidate denial.
- [ ] FE: `getInterview`, `listMyInterviews`, session actions in `interview.service.ts`; candidate upcoming-interviews list (replace N+1); basic interview detail page. No webcam yet.
- [ ] Docs: API_GUIDE.md and README resource map updated.

## 7. Decisions for Phase 3 (not blocking Phase 1)

**Decided 2026-11-09 (owner):** monitoring runs in a **parallel platform tab** next to the external meeting link (option a), and the recruiter sees **events only** (detections, counts, timeline) — no live or recorded video is sent to the recruiter. Still open: consent record (3) and frame transport (4). Option (a) carries an unverified risk — see "Early check" below.

**Early check before building Phase 3:** confirm a webcam can be opened by the platform tab while Google Meet/Zoom/Teams (browser and desktop clients) already holds it, on Windows at least. If a device or driver refuses, fall back to asking the candidate to use a second camera or to pause the call's video, and document that limitation.

Original options, kept for the record:

1. **Where does monitoring run?** Interviews currently use an external meeting link. Options: (a) candidate keeps a platform "monitoring" tab open next to the external call (risk: two apps contending for one camera on some devices/OSes — must be tested); (b) build an in-platform video room (large scope, contradicts "no new infrastructure"); (c) monitoring runs on a separate camera/preview only. This materially changes Phase 3.
2. **Recruiter live view vs. event-only.** The plan mentions "live or sampled video preview" for recruiters; that implies streaming frames to a second party. Event-only (boxes + counts, no video to the recruiter) is far simpler and more privacy-preserving. Confirm which is intended for the MVP.
3. **Consent record.** Where and how long it is stored; wording is a product/legal decision.
4. **Frame transport** (§5.1).

## 8. Baseline verification

Run 2026-11-09, before any change:

| Repo | Command | Result |
|---|---|---|
| BE | `npx jest` | 130 suites / 717 tests passed |
| FE | `npx jest` | 39 suites / 346 tests passed on a solo run. A first run executed concurrently with the BE suite showed 2 failures in `apply-dialog.test.tsx` (a `userEvent` test); they did not reproduce when run alone, so they look load-related, but the root cause was not investigated. |

Not run: BE e2e (needs a separate `.env.test` DB), `tsc`/lint, and app start-up.
