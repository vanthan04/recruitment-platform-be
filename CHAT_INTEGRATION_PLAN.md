# Chat Integration Plan — Recruitment Platform

> Audit + design document, written before any Chat code. Read alongside [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md) and [API_GUIDE.md](API_GUIDE.md).

## 1. Current architecture (audit findings)

**Backend** — NestJS 11 monolith, Prisma 7 + PostgreSQL, `/api/v1` global prefix.
- Clean/DDD per module: `domain/` (framework-agnostic entities + repository interfaces) → `application/` (CQRS commands/queries via `@nestjs/cqrs`, one file per command/query holding both the Command class and its `@CommandHandler`) → `infrastructure/` (Prisma repo impl + persistence mapper + adapters/events) → `presentation/` (controller + DTOs).
- Newer modules (`notification`, `application`) use `CommandBus`/`QueryBus` directly in controllers — no service facade. This is the pattern to follow (older modules like `bookmark`/`category` predate it slightly but are structurally the same).
- Auth: JWT access (15m) + refresh (7d, hashed in `RefreshToken` table for multi-device). `JwtStrategy` (passport-jwt, Bearer header) → `{id, email, role}`. `JwtAuthGuard` + `RolesGuard` (`@Roles(...)`) on controllers, `@GetMe('id')` decorator for the current user.
- Response envelope: `ApiResponse.ok(data, message, metadata, code)` → `{success, message, code, data, metadata, timestamp}`. Domain exceptions (`EntityNotFoundException`, `UnauthorizedDomainException`, `BusinessRuleViolationException`, `DuplicateEntityException`) are mapped to HTTP codes by `GlobalExceptionFilter`.
- Cross-module reads use **ports/adapters** (e.g. `IJobLookupPort`), not direct Prisma joins across module boundaries — this is what keeps modules DB-migration-ready per `MICROSERVICES_MIGRATION_PLAN.md`.
- In-process events: `@nestjs/event-emitter` (`EventEmitter2`) — e.g. `JobAppliedEvent`, `ApplicationStatusChangedEvent` → `ApplicationEventsListener` (lives in `notification` module) → `CreateNotificationCommand`.
- **No Redis. No Kafka. No WebSocket infrastructure of any kind exists today.** `MICROSERVICES_MIGRATION_PLAN.md` is a *proposal only* (not implemented) — the app is a single-instance monolith today. This matters for Chat: no pub/sub layer to reuse, no multi-instance concern yet.
- File storage: `IFileStorageProvider` (port) → `S3StorageProvider` (adapter). Generic `POST /files/upload` (multipart, JWT-only, 5MB limit) is reused by avatar upload and CV upload — callers upload first, then PATCH/POST the returned URL into their own resource. No extra validation happens server-side beyond mimetype/size at multer level; this is the established trust model in this codebase.
- Rate limiting: global `@nestjs/throttler` (60 req/60s) + per-route `@Throttle` override on sensitive endpoints (register/login).
- Pagination: offset-based (`PageOptionsDto` page/limit) everywhere today — no cursor pagination precedent yet.
- Prisma models relevant to Chat: `User` (id, role, companyId), `Job` (id, postedById, companyId, status), `JobApplication` (id, userId, jobId, cvId, status: PENDING/ACCEPTED/REJECTED/WITHDRAWN, `@@unique([userId, jobId])`). **There is no SHORTLISTED/CONTACTED status** — `ACCEPTED` is the closest existing analog to "recruiter wants to proceed with this candidate."

**Frontend** — Next.js 15 App Router, React 19, TypeScript.
- **Server-first**: almost all backend calls happen in Server Components / Server Actions (`"use server"`) via a `server-only` `api` client (`lib/api/index.ts`) that reads the httpOnly `access_token` cookie and attaches `Authorization: Bearer`. There is **no client-side authenticated fetch today** — this is the single most important constraint for realtime chat (see §5).
- Auth cookies: `access_token` (15m) / `refresh_token` (7d), both httpOnly, set by `middleware.ts` → `session.middleware.ts` (proactive refresh) and `auth.middleware.ts` (route protection, `PROTECTED_PREFIXES = [PATH.PROFILE]` only — most pages are public-with-personalization, not gated).
- State management: `@reduxjs/toolkit` + `react-redux` are **installed but unused** — zero existing store. The one real precedent for client-side state is a plain `React.createContext` + `useState` (`contexts/sidebar-context.tsx`). No React Query/SWR anywhere; all list data is fetched server-side per request.
- UI: Tailwind v4 + shadcn-style wrapper components in `components/ui/*` built on the unified `radix-ui` package (already a dependency — `Avatar`, `ScrollArea` etc. are available from it without adding new packages, just need wrapper components like the existing `dialog.tsx`).
- Routing: flat `(auth)` / `(main)` route groups — **no role-based route split exists** (no `/recruiter/*` today). Recruiters currently have **no dedicated frontend at all** — `getApplicationsForJob` / `updateApplicationStatus` server actions exist (`lib/services/job-application.service.ts`) but no page calls them. This is a pre-existing gap, not something introduced by Chat.
- `BACKEND_URL` is a server-only env var (not `NEXT_PUBLIC_`) — the browser never talks to the backend origin directly today.

## 2. Where Chat lives

Native module inside the existing monolith: `recruitment-platform-be/src/modules/chat/`, following the **notification module's** structure exactly (it's the newest/closest-shaped precedent — small aggregate, CQRS handlers, one cross-module listener). No new service, no separate ChatApp. Frontend: new files under existing `app/(main)/`, `components/chat/`, `lib/`.

## 3. Database design

New Prisma models, additive only (no changes to existing tables besides new relations):

```prisma
enum ConversationStatus { ACTIVE ARCHIVED }
enum MessageType { TEXT IMAGE FILE SYSTEM }
enum ChatParticipantRole { CANDIDATE RECRUITER } // mirrors UserRole, scoped to chat membership

model Conversation {
  id             String   @id @default(uuid())
  status         ConversationStatus @default(ACTIVE)
  lastMessageAt  DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  job            Job            @relation(fields: [jobId], references: [id], onDelete: Cascade)
  jobId          String
  application    JobApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  applicationId  String         @unique   // 1 conversation per application — see dedup rule below
  candidate      User           @relation("ConversationCandidate", fields: [candidateId], references: [id], onDelete: Cascade)
  candidateId    String
  recruiter      User           @relation("ConversationRecruiter", fields: [recruiterId], references: [id], onDelete: Cascade)
  recruiterId    String

  members        ConversationMember[]
  messages       Message[]

  @@index([candidateId])
  @@index([recruiterId])
  @@map("conversations")
}

model ConversationMember {
  id             String   @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           ChatParticipantRole
  joinedAt       DateTime @default(now())
  lastReadAt     DateTime?

  @@unique([conversationId, userId])
  @@index([userId])
  @@map("conversation_members")
}

model Message {
  id              String   @id @default(uuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId        String
  sender          User     @relation(fields: [senderId], references: [id], onDelete: Cascade)
  content         String
  messageType     MessageType @default(TEXT)
  clientMessageId String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  attachments     MessageAttachment[]

  @@unique([conversationId, clientMessageId]) // idempotency
  @@index([conversationId, createdAt])         // cursor pagination
  @@index([senderId])
  @@map("messages")
}

model MessageAttachment {
  id        String   @id @default(uuid())
  messageId String
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  fileName  String
  fileUrl   String
  mimeType  String
  fileSize  Int
  createdAt DateTime @default(now())

  @@index([messageId])
  @@map("message_attachments")
}
```

Decisions worth calling out:
- **No separate `MessageRead` table.** Conversations here are always exactly 2 members (candidate + recruiter) — a per-message read-receipt table would be pure overhead. `ConversationMember.lastReadAt` (updated on `POST /conversations/:id/read`) is enough to compute unread counts (`count(messages where createdAt > lastReadAt and senderId != userId)`) and a boolean "read" receipt for the other member's last message.
- **Dedup key is `applicationId`, unique**, not a composite `(candidateId, recruiterId, jobId)` index. `JobApplication` already has `@@unique([userId, jobId])`, so `applicationId` alone already uniquely determines the candidate+job+recruiter triple. This is simpler, gives a real DB constraint, and matches the actual business object that creates the conversation. `candidateId`/`recruiterId`/`jobId` are still denormalized onto `Conversation` for cheap list queries without joining through `JobApplication`.
- Conversation creation is race-safe via `prisma.conversation.upsert({ where: { applicationId } })`, not "check then create".

Indexes added: `messages(conversationId, createdAt)`, `messages(senderId)`, unique `messages(conversationId, clientMessageId)`, unique `conversation_members(conversationId, userId)`, `conversation_members(userId)`, unique `conversations(applicationId)`, `conversations(candidateId)`, `conversations(recruiterId)`, `message_attachments(messageId)` — all chosen for the actual query patterns in §4 (list-by-user, paginate-by-conversation, idempotency lookup), nothing speculative.

## 4. REST API (`/api/v1`, same conventions as every other module)

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/conversations` | `JwtAuthGuard`, `RolesGuard(RECRUITER)` | body `{applicationId}`. Requires `application.status === ACCEPTED` and `job.postedById === requester`. Upsert-by-applicationId (idempotent, race-safe). |
| `GET` | `/conversations` | `JwtAuthGuard` | Offset-paginated (`page`/`limit`, matches `PageOptionsDto` convention), current user's conversations, sorted by `lastMessageAt desc`, includes unread count + other-participant summary + job title/status snapshot. |
| `GET` | `/conversations/:id` | `JwtAuthGuard` | Member-only (403 via `UnauthorizedDomainException` otherwise). |
| `GET` | `/conversations/:id/messages` | `JwtAuthGuard` | **Cursor-based** (`?cursor=<messageId>&limit=30`) — the one place this codebase adopts cursor pagination, because "never load all messages" + infinite-scroll-upward is a real requirement here, unlike every other list in the app. Member-only. |
| `POST` | `/conversations/:id/messages` | `JwtAuthGuard` | body `{content, messageType?, clientMessageId, attachments?[]}`. Member-only. Same `CreateMessageHandler` used by the WS gateway (§6) — single source of truth, no duplicated logic. |
| `PATCH` | `/messages/:id` | `JwtAuthGuard` | Sender-only, content only, not soft-deleted. |
| `DELETE` | `/messages/:id` | `JwtAuthGuard` | Sender-only, soft-delete (`deletedAt`), content masked in responses. |
| `POST` | `/conversations/:id/read` | `JwtAuthGuard` | Member-only, sets `lastReadAt = now()`. |

Attachments: **reuse `POST /files/upload` as-is** (folder `chat-attachments`), exactly like avatar/CV upload already do — client uploads first, then references the returned `{url}` in the message payload. No new S3/storage config. Backend still validates the attachment metadata shape (allowed mimetypes, max 5 attachments/message, size sanity) via DTOs when persisting `MessageAttachment` rows — trusting the URL itself is the same trust model already used for avatars and CVs in this codebase, so this isn't a new/weaker precedent.

Rate limiting: `@Throttle` override on `POST .../messages` (reuses `@nestjs/throttler`, already global), same pattern as `register`/`login`.

## 5. WebSocket design — the key architectural decision

Nest Gateway using `@nestjs/websockets` + `@nestjs/platform-socket.io` (new deps — no WS infra exists to reuse, and this matches the Express-based backend already in place). Single namespace, e.g. `/ws`.

**Auth problem**: the browser has no access to the JWT — `access_token` is httpOnly, and the existing frontend architecture never fetches the backend from client JS. Socket.IO's handshake is an HTTP request, so it **does** carry cookies automatically when the client is created with `withCredentials: true` and the backend's existing CORS config (`credentials: true`, already in `main.ts`) allows it. The gateway's `handleConnection` parses the `access_token` cookie out of `client.handshake.headers.cookie` and verifies it with the same `JWT_SECRET` (`JwtService.verifyAsync`, mirroring `JwtStrategy`) — no new auth mechanism, just the existing JWT validated at a different transport boundary. Token is validated **once, at connect time** (standard Socket.IO+JWT pattern); a mid-session expiry doesn't kill an open socket — if the socket drops and reconnects, the browser will have picked up a refreshed cookie via the normal REST-triggered refresh flow by then. This is a deliberate, documented simplification, not an oversight.

This requires the browser to reach the backend origin directly for the socket handshake — a genuinely new requirement, so one new **public** env var is needed: `NEXT_PUBLIC_BACKEND_URL` (frontend), used only by the socket client, distinct from the existing server-only `BACKEND_URL`.

On connect: join a personal room `user:{userId}` (for cross-conversation notifications like unread badges). Client then emits `conversation:subscribe` per open conversation → gateway re-checks membership via `ConversationMember` → joins `conversation:{id}` room.

Events:
| Event | Direction | Notes |
|---|---|---|
| `message:send` | C→S | `{conversationId, clientMessageId, content, messageType, attachments?}` → runs through the **same `CreateMessageHandler`** as the REST endpoint → ack to sender + `message:new` broadcast to `conversation:{id}` and each member's `user:{id}` room. |
| `message:new` | S→C | persisted message, broadcast only after DB write succeeds (never optimistic on the server side). |
| `message:read` | C→S | `{conversationId}` → same `MarkAsReadHandler` as REST → `message:read` broadcast (read receipt). |
| `typing:start` / `typing:stop` | C↔S | not persisted, relayed to room excluding sender. Client debounces (~2s) before emitting `typing:stop`. |
| `user:online` / `user:offline` | S→C | driven by an in-memory `ChatPresenceService` (Map of `userId → socket count`), broadcast to the *other* member of each conversation the user belongs to. |

Idempotency is transport-agnostic: the unique `(conversationId, clientMessageId)` constraint means a REST retry, a WS reconnect-resend, or a double-click all collapse to one row regardless of which path they came in through.

A small in-memory per-socket counter throttles `message:send` (this is the one new small piece of rate-limiting code — `@nestjs/throttler` isn't wired to gateways in this Nest version, and this is additive coverage, not a duplicate limiter).

## 6. Redis / Kafka

**Not adding either.** Redis would only earn its keep here for (a) horizontal scaling of the Socket.IO adapter across multiple Node instances, or (b) presence/typing state shared across instances — this app runs as a single instance today (confirmed: no Redis, no orchestration, `MICROSERVICES_MIGRATION_PLAN.md` is unimplemented). An in-memory `ChatPresenceService` and Socket.IO's built-in in-process room broadcasting cover single-instance correctly. **Documented upgrade path** (not built): swap to `@socket.io/redis-adapter` + move `ChatPresenceService` state into Redis if/when this ever runs >1 instance. Kafka: same reasoning as the existing notification flow — `EventEmitter2` in-process is what the rest of the app uses for exactly this kind of "fire a domain event, something else reacts" need; Chat's `MESSAGE_SENT` event follows the same `ApplicationEventsListener` pattern, not a new async transport.

## 7. Authentication & Authorization

Nothing new for REST (existing `JwtAuthGuard`/`RolesGuard`/`@GetMe`). For WS, see §5. Authorization is enforced in every handler, never trusted from the client:
- `POST /conversations`: requester must be the job's `postedById` (recruiter), application must be `ACCEPTED`.
- Every conversation/message operation (REST and WS) re-checks `currentUser ∈ conversation members` via `ConversationMember` lookup before reading/writing — never inferred from a client-supplied `conversationId` alone.
- Edit/delete: sender-only.

## 8. Recruitment integration

- Conversation always carries `jobId` + `applicationId` — UI can always show "Job title — Application status: ACCEPTED" in the chat header.
- Trigger: recruiter clicks "Message" on an `ACCEPTED` application → `POST /conversations {applicationId}` (idempotent) → navigate to `/messages?conversationId=...`. No auto-creation on status change — creation is an explicit recruiter action, which is both simpler and avoids surprise conversations appearing from a background status transition.
- `Message.messageType` includes `SYSTEM` and the conversation keeps its `applicationId`/`jobId` link specifically so a future Interview module can drop a system message into the right conversation — no Interview logic is built now (out of scope per the task), this is just not closing the door on it.

## 9. Notification integration

Reuses the existing `notification` module — no parallel notification path. New `NotificationType.NEW_MESSAGE` value. Flow: message persisted (either transport) → `EventEmitter2.emit('message.sent', …)` → new `ChatEventsListener` (chat module) → checks `ChatPresenceService` for the *recipient*: if they have zero connected sockets, dispatch the existing `CreateNotificationCommand`; if they're online, skip (they'll see it live) — matching rule 20's "online → realtime only, offline → notification."

## 10. Frontend architecture

- **Initial data (SSR)**: conversation list + first page of messages fetched server-side via new server actions in `lib/services/chat.service.ts`, following the exact pattern of `job-application.service.ts` — consistent with how every other page in this app loads data.
- **Live state**: a plain `React.createContext` + `useReducer` provider (`contexts/chat-context.tsx`), matching the actual working precedent in this codebase (`sidebar-context.tsx`) rather than wiring up the installed-but-never-used Redux Toolkit. Chat's live state (messages of the open conversation, typing, presence, connection status) is scoped to one feature area, not app-wide — Context's lack of selector-based re-render optimization is an acceptable tradeoff at this scale, and it keeps the pattern consistent with the only state-management precedent that actually exists in the repo today. `ChatProvider` wraps only the `/messages` route subtree, not the root layout.
- **Socket client**: `lib/realtime/socket.ts`, a lazily-created singleton `socket.io-client` instance (new dependency — no WS client exists), `{ withCredentials: true }`, pointed at `NEXT_PUBLIC_BACKEND_URL`. A `useChatSocket` hook owns connect/disconnect/reconnect and dispatches into the `chat-context` reducer.
- **Reconnect resync**: on reconnect, re-fetch messages newer than the last known message id/timestamp for the currently-open conversation (REST call, not assumed-delivered-over-socket).
- **Optimistic send**: `MessageInput` generates a `clientMessageId` (crypto.randomUUID), renders the message immediately as `sending`, reconciles to `sent` when the `message:new` echo (REST response or WS ack) with the same `clientMessageId` arrives; `failed` + retry affordance on error.
- **UI components** (`components/chat/`): `ConversationList`, `ConversationItem`, `ChatWindow`, `MessageList`, `MessageBubble`, `MessageInput`, `TypingIndicator`, `OnlineIndicator`, `ConversationHeader`, `MessageAttachmentPreview` — built on existing `components/ui/*` primitives (`Button`, `Input`, `Badge`, `Skeleton`, `Separator`) plus two new shadcn-style wrappers (`Avatar`, `ScrollArea`) around the already-installed `radix-ui` package — no new UI library.
- **Routes**: single `/messages` route under `(main)` (not split `/candidate/messages` + `/recruiter/messages` — this app has no role-based route split anywhere today, so a shared route that adapts its content to `currentUser.role` is more consistent with existing convention). `?conversationId=` query param selects the open thread, mirroring the existing `@modal`/query-param patterns already used for jobs.
- **Recruiter gap**: no recruiter frontend exists at all today (see §1). Closing the full loop described in the task ("Application Detail → \[Send Message\]") requires *some* recruiter-facing page — the smallest correct addition is a minimal `app/(main)/recruiter/applications/[jobId]/page.tsx` reusing the already-existing-but-unused `getApplicationsForJob`/`updateApplicationStatus` server actions, with a "Message" button once `ACCEPTED`. This is in scope because Chat's own acceptance criteria require it to close the loop; a full recruiter dashboard (job posting/editing UI, analytics, etc.) is explicitly out of scope and not built.

## 11. File upload strategy

No new upload endpoint. `POST /files/upload` (existing, JWT-gated, 5MB limit) is called from `MessageInput`'s attachment button exactly like `updateAvatar`/CV upload already call it; the returned URL is sent as part of the `POST .../messages` (or `message:send`) payload.

## 12. Testing strategy

Backend (Jest, existing config/conventions):
- Domain entity unit tests: `conversation.entity.spec.ts`, `message.entity.spec.ts`.
- Handler unit tests (mocked repositories, mirroring `apply-job.use-case.spec.ts`/`login.use-case.spec.ts` style): create-conversation (dedup + authorization), create-message (idempotency via duplicate `clientMessageId`), mark-as-read, list-conversations (authorization/membership).
- E2E (`test/app.e2e-spec.ts` extension or a new spec file): register recruiter+candidate → job → apply → accept → create conversation → send message → paginate → mark read, against a real DB, matching the existing e2e style.

Frontend (Jest + RTL, existing config):
- `MessageBubble`, `ConversationList` render tests, mirroring `jobs-list.test.tsx`.
- Reducer/context unit test for optimistic send → reconcile → failure/retry transitions.

WebSocket gateway integration tests (socket.io-client against a real Nest test app) are the one area intentionally kept light given time constraints — flagged in the final report's limitations rather than skipped silently.

## 13. Migration strategy

Additive Prisma migration only (`prisma migrate dev --name add_chat_module`) — no changes to existing tables/columns, no backfill needed (Chat has no historical data). Existing test suite (41 tests per `CODEBASE_SUMMARY.md`) must continue passing unchanged.

## 14. Risks

- **Single-instance WS**: acceptable now, documented Redis-adapter upgrade path if the app is ever deployed across multiple instances (§6).
- **Cookie-based WS auth requires the browser to reach the backend origin directly** — a new CORS/network surface that didn't exist before (previously 100% server-to-server). Mitigated by reusing the existing `CORS_ORIGIN`/`credentials: true` config rather than loosening it further.
- **No recruiter frontend precedent** — the minimal recruiter applications page (§10) is new surface area with less existing pattern to lean on than the rest of the task; kept deliberately small.
- **JWT validated only at WS connect time** — acceptable per §5's reasoning, but worth re-checking if session-revocation-mid-socket ever becomes a real requirement (e.g. admin force-logout).
