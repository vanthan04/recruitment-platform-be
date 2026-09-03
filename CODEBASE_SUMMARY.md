# Recruitment Platform Backend — Codebase Summary

> Ghi lại để dùng lại khi cần nhớ nhanh kiến trúc & luồng nghiệp vụ của dự án.

## 1. Tổng quan

- **Loại dự án:** Backend API cho một job portal — ứng viên (candidate) tìm và ứng tuyển việc làm, nhà tuyển dụng (recruiter) đăng tin và quản lý ứng viên, admin quản trị người dùng.
- **Framework:** NestJS 11 (Express platform), TypeScript.
- **ORM/DB:** Prisma 7 + PostgreSQL.
- **Auth:** JWT (access + refresh token) qua `@nestjs/jwt` + `passport-jwt`.
- **Khác:** class-validator/class-transformer (validation), Swagger (`/api/v1/docs`), AWS S3/SES SDK, Nodemailer, bcrypt.
- **Global API prefix:** `/api/v1`.
- **Entry point:** [src/main.ts](src/main.ts) — bật `ValidationPipe` (whitelist + transform), `GlobalExceptionFilter`, Swagger.

## 2. Kiến trúc: Clean Architecture / DDD theo từng module

Mỗi module nghiệp vụ trong `src/modules/*` đều tách theo 4 lớp:

```
modules/<name>/
├── domain/            # Entity, Value Object, Repository interface — KHÔNG import NestJS/Prisma
├── application/        # Use-cases (1 class = 1 hành vi nghiệp vụ), DTO response, mapper
├── infrastructure/      # Prisma repository impl, persistence mapper, adapter, event
├── presentation/        # Controller, request DTO, guard/strategy (nếu có)
└── <name>.module.ts
```

Điểm đáng chú ý:
- **Domain entity là "framework-agnostic"**: ví dụ [Cv](src/modules/cv/domain/entities/cv.entity.ts) chứa toàn bộ business rule (`publish()`, `unpublish()`, `softDelete()`, `ensureOwner()`, `addSkill()` chống trùng tên...) không phụ thuộc Nest/Prisma. Mỗi module tự ném exception riêng định nghĩa trong `domain/exceptions/<module>.exceptions.ts` (kế thừa các lớp `DomainException` con dùng chung ở `common/`), thay vì dùng chung 1 bộ exception generic.
- **Repository pattern**: domain định nghĩa interface (`IXxxRepository`/port), infrastructure implement bằng Prisma (`xxx-prisma.repository.ts`) + mapper để convert Prisma model ⇄ Domain entity. Có `BaseEntity` ([base.entity.ts](src/common/domain/base.entity.ts)) và `BasePrismaRepository` generic ([base-prisma.repository.ts](src/common/infrastructure/base-prisma.repository.ts)) dùng chung.
- **CQRS pattern** (`@nestjs/cqrs`): mỗi hành động nghiệp vụ là 1 `Command` (ghi) hoặc 1 `Query` (đọc) + đúng 1 `Handler` tương ứng (`@CommandHandler`/`@QueryHandler`), controller chỉ dựng command/query rồi gọi `CommandBus.execute()`/`QueryBus.execute()` — không còn pattern "use-case class" cũ. Toàn bộ 16 module business đã theo pattern này (44 command + 25 query hiện có), chỉ `mail` (thuần port/provider, không có hành vi riêng) và `prisma` (hạ tầng dùng chung) là ngoại lệ hợp lý.
- **Ports & Adapters**: mọi truy cập chéo module đều qua 1 port cục bộ do module gọi tự định nghĩa (vd. `ICompanyLookupPort` trong `job`), implement bằng adapter bọc repository interface của module kia (`infrastructure/adapters/xxx-lookup.adapter.ts`) — không gọi thẳng use-case/controller của module kia. Module `auth` định nghĩa port riêng (`IAuthUserRepositoryPort`, `IAuthMailServicePort`) theo đúng pattern này với `user`/`mail`.
- **Response chuẩn hoá**: mọi controller trả về qua [ApiResponse.ok(...)](src/common/dtos/api-response.ts) (builder pattern) → `{ success, message, code, data, metadata }`.
- **Exception xử lý tập trung**: [GlobalExceptionFilter](src/common/filters/http-exception.filter.ts) (nay là `@Injectable()`, nhận `PinoLogger` qua DI thay vì `new Logger()`) bắt mọi exception, map `DomainException` con (`EntityNotFoundException`→404, `UnauthorizedDomainException`→403, `DuplicateEntityException`→409, `BusinessRuleViolationException`→400) và cả lỗi validation của Nest. Log kèm `requestId` (sinh bởi `pino-http`, xem mục "Vận hành" bên dưới) và cũng trả `requestId` đó trong `metadata` của response lỗi — dùng để đối chiếu log khi debug.

## 3. Domain model (Prisma schema — [prisma/schema.prisma](prisma/schema.prisma))

| Model | Ghi chú |
|---|---|
| `User` | email/password, `role` (CANDIDATE/RECRUITER/ADMIN), `status` (PENDING/ACTIVE/BLOCKED), `refreshToken`, `verifyCode` |
| `Profile` | 1-1 với User: fullName, headline, summary, avatar, gender, phone... |
| `Cv` | thuộc 1 User (candidate); status DRAFT/PUBLISHED; soft-delete (`deletedAt`); có `Experience[]`, `Education[]`, `Skill[]` |
| `Job` | thuộc 1 User (recruiter, `postedById`); status DRAFT/OPEN/CLOSED; jobType; salary range; soft-delete |
| `JobApplication` | liên kết User + Job + Cv; status PENDING/ACCEPTED/REJECTED; unique theo (userId, jobId) |
| `Bookmark` | User bookmark Job; unique theo (userId, jobId) |
| `InterviewSchedule` | thuộc 1 `JobApplication`; `scheduledAt`, `location`/`meetingLink` (bắt buộc ≥1), `note`; status SCHEDULED/RESCHEDULED/CANCELLED; `createdById` (recruiter) |

## 4. Danh sách module & API chính

**P7 hardening (2026-09-02):** CORS bật trong `main.ts` (origin cấu hình qua `CORS_ORIGIN`, optional); `@nestjs/throttler` global (60 req/60s) + giới hạn chặt hơn (5 req/60s) cho `register`/`login`/`forgot-password`; giới hạn kích thước file upload (5MB file chung, 10MB CV document); refresh token chuyển từ 1 field trên `User` sang bảng `RefreshToken` riêng — hỗ trợ đăng nhập nhiều thiết bị độc lập, rotation (mỗi refresh thu hồi token cũ), `POST /auth/logout` (thu hồi 1 thiết bị) và `POST /auth/logout-all` (thu hồi tất cả). Bug đã fix: JWT refresh token dùng thêm `jti` (random UUID) để tránh trùng token khi 2 lần login xảy ra cùng giây (JWT vốn deterministic theo payload+secret).

### `auth` — [auth.module.ts](src/modules/auth/auth.module.ts)
Controller: [AuthController](src/modules/auth/presentation/controllers/auth.controller.ts) — `POST /auth/register|login|verify|forgot-password|reset-password|change-password|logout|refresh`.
- `AuthService` là facade gọi các use-case (Register, Login, VerifyEmail, ForgotPassword, ResetPassword, ChangePassword) + tự quản lý access/refresh token (access 15m, refresh 7d, refresh token hash bằng bcrypt trước khi lưu DB).
- `JwtStrategy` verify Bearer token, `JwtAuthGuard`/`PermissionGuard` bảo vệ route theo permission DB-driven (`@RequirePermissions(...)`, đọc từ `@GetMe()` decorator lấy user từ request). Authorization là RBAC: `User → Role → RolePermission → Permission` (module [permission](src/modules/permission/permission.module.ts)) — `PermissionGuard` tra `role_permissions` trong DB (có cache TTL 30s, invalidate khi admin đổi quyền qua `PUT /admin/roles/:id/permissions`), không hard-code role→permission trong code.

### `user` — [user.module.ts](src/modules/user/user.module.ts)
- [UserController](src/modules/user/presentation/controllers/user.controller.ts): `GET /users/me`, `PATCH /users/profile` (tự quản lý profile cá nhân).
- [UserAdminController](src/modules/user/presentation/controllers/user-admin.controller.ts) (role ADMIN): `GET /admin/users` (phân trang), `PATCH /admin/users/:id` (đổi status/role).

### `cv` — [cv.module.ts](src/modules/cv/cv.module.ts)
[CvController](src/modules/cv/presentation/controllers/cv.controller.ts): `POST /cvs`, `GET /cvs`, `GET /cvs/:id`, `PATCH /cvs/:id`, `PATCH /cvs/:id/publish`, `DELETE /cvs/:id` (soft-delete).
Business rule đáng chú ý: publish CV bắt buộc phải có ít nhất 1 experience/education; chỉ chủ sở hữu (`ensureOwner`) mới sửa/xoá được.

### `company` — [company.module.ts](src/modules/company/company.module.ts)
[CompanyController](src/modules/company/presentation/controllers/company.controller.ts): `POST /companies` (RECRUITER, 1 company/recruiter, auto gán `User.companyId`), `GET /companies` (public, search theo tên/industry), `GET /companies/:id` (public, kèm danh sách job đang OPEN), `PATCH/DELETE /companies/:id` (owner only, delete = soft-delete).
`Job.companyId` là FK bắt buộc tới `Company` — recruiter phải tạo company trước khi đăng job (`CreateJobUseCase` tự lấy `companyId` từ `User.companyId`, không nhận trực tiếp từ client).

### `category` — [category.module.ts](src/modules/category/category.module.ts)
[CategoryController](src/modules/category/presentation/controllers/category.controller.ts): `GET /categories` (public, cho FE làm dropdown filter), `POST/PATCH/DELETE /categories` (role ADMIN). Job có thể gắn `categoryId` (optional) và `level` (enum `JobLevel`: INTERN→MANAGER) để lọc tìm kiếm chi tiết hơn. Xoá category không phá job liên quan — Prisma tự `SET NULL` `Job.categoryId`.

### `notification` — [notification.module.ts](src/modules/notification/notification.module.ts)
[NotificationController](src/modules/notification/presentation/controllers/notification.controller.ts): `GET /notifications` (phân trang), `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.
Dùng `@nestjs/event-emitter` (`EventEmitterModule.forRoot()` global trong `AppModule`): [ApplicationEventsListener](src/modules/notification/infrastructure/listeners/application-events.listener.ts) lắng nghe `job.applied` (phát từ [ApplyJobHandler](src/modules/application/application/commands/apply-job.command.ts) → tạo notification cho recruiter) và `application.status_changed` (phát từ [UpdateApplicationStatusHandler](src/modules/application/application/commands/update-application-status.command.ts) → tạo notification cho candidate).

CV module bổ sung: `Cv.fileUrl` (nullable) — `POST /cvs/:id/upload` (multipart, PDF/DOC/DOCX, owner only) lưu file có sẵn qua module `file-upload`; `GET /cvs/:id/export` xuất CV structured ra PDF (dùng `pdfkit`, không cần trình duyệt headless).

Application module bổ sung: `PATCH /job-applications/:id/withdraw` (candidate rút đơn, chỉ khi `PENDING`, thêm status `WITHDRAWN`), `GET /job-applications/job/:jobId/stats` (recruiter xem thống kê: `viewCount` của job + số đơn theo từng status). `Job.viewCount` tự tăng mỗi lần `GET /jobs/:id` (fire-and-forget, không chặn response).

### `job-alert` — [job-alert.module.ts](src/modules/job-alert/job-alert.module.ts)
[SavedSearchController](src/modules/job-alert/presentation/controllers/saved-search.controller.ts): `POST/GET/DELETE /saved-searches` (role CANDIDATE) — lưu điều kiện tìm việc (keyword/location/categoryId/jobType).
[SendJobAlertDigestsHandler](src/modules/job-alert/application/commands/send-job-alert-digests.command.ts) chạy mỗi ngày 7h sáng UTC: với mỗi saved search, tìm job mới đăng trong 24h qua khớp điều kiện → gửi mail digest qua `IMailPort`. Trigger là [job-alert-digest.cron.ts](src/modules/job-alert/application/jobs/job-alert-digest.cron.ts) — `@Cron('0 7 * * *')` trong process (`@nestjs/schedule`), dispatch `SendJobAlertDigestsCommand` qua `CommandBus`. (Từng chuyển qua Lambda + EventBridge Scheduler ở P11, đã revert về in-process khi đổi deploy target sang EC2 — xem mục "Vận hành" bên dưới.)

### `job` — [job.module.ts](src/modules/job/job.module.ts)
[JobController](src/modules/job/presentation/controllers/job.controller.ts): `POST/PATCH/DELETE /jobs` (role RECRUITER, chỉ owner), `GET /jobs` (search công khai, filter theo keyword/location/jobType/salary/companyId + pagination), `GET /jobs/:id`, `PATCH /jobs/:id/close`, `PATCH /jobs/:id/reopen` (owner only).
[CloseExpiredJobsHandler](src/modules/job/application/commands/close-expired-jobs.command.ts) chạy mỗi giờ, tự động `CLOSED` các job `OPEN` đã qua `expiresAt`. Trigger là [close-expired-jobs.cron.ts](src/modules/job/application/jobs/close-expired-jobs.cron.ts) — `@Cron(CronExpression.EVERY_HOUR)` trong process (`@nestjs/schedule`), dispatch `CloseExpiredJobsCommand` qua `CommandBus`, xem mục "Vận hành" bên dưới.

### `application` (job-application) — [job-application.module.ts](src/modules/application/job-application.module.ts)
[JobApplicationController](src/modules/application/presentation/controllers/job-application.controller.ts):
- `POST /job-applications` — candidate nộp đơn (kèm CV).
- `GET /job-applications/my-applications` — candidate xem đơn của mình.
- `GET /job-applications/job/:jobId` — recruiter (chủ job) xem danh sách ứng viên.
- `PATCH /job-applications/:id/status` — recruiter duyệt/từ chối.
Phát event `JobAppliedEvent` khi nộp đơn.

### `bookmark` — [bookmark.module.ts](src/modules/bookmark/bookmark.module.ts)
[BookmarkController](src/modules/bookmark/presentation/controllers/bookmark.controller.ts): `POST /bookmarks/toggle/:jobId` (toggle lưu/bỏ lưu job), `GET /bookmarks` (danh sách job đã lưu) — role CANDIDATE.

### `file-upload` — [file-upload.module.ts](src/modules/file-upload/file-upload.module.ts)
[FileUploadController](src/modules/file-upload/presentation/controllers/file-upload.controller.ts): `POST /files/upload` (multipart, cần JWT) — lưu qua `S3StorageProvider` (interface `IFileStorageProvider` cho phép đổi provider), dùng ở avatar, CV, v.v.

### `mail` — [mail.module.ts](src/modules/mail/mail.module.ts)
Port `IMailServicePort` + implementation `NodemailerMailProvider` — gửi email xác thực, quên mật khẩu... dùng chung qua `auth`'s `AuthMailAdapter`.

### `chat` — [chat.module.ts](src/modules/chat/chat.module.ts)
Native recruitment chat — xem [API_GUIDE.md](API_GUIDE.md#411-chat-conversations-messages--websocket) cho API/WebSocket.
- Domain: `Conversation` (1-1 với `JobApplication`, `applicationId` unique), `ConversationMember`, `Message` (idempotent qua `clientMessageId`), `MessageAttachment`.
- [ConversationController](src/modules/chat/presentation/controllers/conversation.controller.ts) (`/conversations`), [MessageController](src/modules/chat/presentation/controllers/message.controller.ts) (`/messages`).
- [ChatGateway](src/modules/chat/infrastructure/gateways/chat.gateway.ts): Socket.IO namespace `/ws`, xác thực bằng cookie `access_token` (không phải Bearer) vì browser mở socket trực tiếp tới backend, không qua Next.js server. `CreateMessageHandler` (dùng chung bởi REST và WS) phát `MESSAGE_SENT_EVENT` sau khi lưu — gateway lắng nghe event này để broadcast `message:new`, đảm bảo tin nhắn gửi qua đường nào cũng phát tới người nhận như nhau.
- [ChatEventsListener](src/modules/chat/infrastructure/listeners/chat-events.listener.ts): giống `ApplicationEventsListener` — tạo `NotificationType.NEW_MESSAGE` khi người nhận offline (tra qua [ChatPresenceService](src/modules/chat/infrastructure/services/chat-presence.service.ts), in-memory single-instance).
- Cross-module reads qua port riêng (`IChatJobLookupPort`/`IChatApplicationLookupPort`/`IChatUserLookupPort`) — theo đúng pattern các module khác, không JOIN thẳng bảng của module khác.

### `interview` — [interview.module.ts](src/modules/interview/interview.module.ts)
**P10 (2026-09-02):** recruiter đặt/dời/huỷ lịch phỏng vấn cho 1 `JobApplication`; candidate được gửi email ở cả 3 hành động.
- [InterviewController](src/modules/interview/presentation/controllers/interview.controller.ts): `POST /interviews`, `PATCH /interviews/:id` (dời lịch), `PATCH /interviews/:id/cancel`, `GET /interviews/application/:applicationId` (candidate chủ đơn hoặc recruiter chủ job).
- Domain [InterviewSchedule](src/modules/interview/domain/entities/interview-schedule.entity.ts): bắt buộc có ít nhất 1 trong 2 field `location`/`meetingLink` (validate ngay ở entity); `reschedule()` yêu cầu thời gian mới phải ở tương lai và interview chưa `CANCELLED`.
- Owner check giống `application` module: `job.postedById !== recruiterId` → `UnauthorizedDomainException`. Cross-module reads qua port riêng (`IInterviewJobLookupPort`/`IInterviewApplicationLookupPort`/`IInterviewUserLookupPort`), cùng pattern `IChatJobLookupPort` của module `chat`.
- Email gửi trực tiếp, đồng bộ trong command handler qua `IMailService` (module `mail`) — không qua event, vì đây là pattern email duy nhất đang tồn tại trong hệ thống (giống `register.command.ts`). Nội dung build động: có `meetingLink` thì hiện link online, có `location` thì hiện địa điểm trực tiếp, có cả hai thì hiện cả hai. Recruiter tự dán link Meet/Zoom thủ công — hệ thống không tích hợp API tạo lịch/link tự động.
- Không có in-app notification cho interview (chưa đụng `NotificationType` enum) và không đính kèm `.ics` — để ngoài scope, có thể làm sau.

### `prisma` — [prisma.module.ts](src/modules/prisma/prisma.module.ts)
`PrismaModule.forRoot({...})` global, cung cấp `PrismaService` (wrap `PrismaClient`, cấu hình log query/info/warn/error).

### `common/`
Chứa building block dùng chung: `BaseEntity`, `BasePrismaRepository`, `ApiResponse`/`ResponseDto`, `PageOptionsDto`/`PageMetaDto` (pagination), enums (`UserRole`, `UserStatus`, `Gender`, `Permission` — permission identifiers dùng bởi `@RequirePermissions`, DB vẫn là nguồn sự thật cho role→permission), decorators (`@GetMe`, `@RequirePermissions`), guards (`JwtAuthGuard`, `PermissionGuard`), domain exceptions (`domain.exception.ts`), `GlobalExceptionFilter`, `env.validation.ts` (Joi schema cho biến môi trường), `app.config.ts`.

### `permission` — [permission.module.ts](src/modules/permission/permission.module.ts)
RBAC database-driven: `roles` / `permissions` / `role_permissions` tables (Prisma models `Role`/`Permission`/`RolePermission`), `users.roleId` FK (giữ song song với `users.role` enum cũ, sync tự động bằng DB trigger — xem migration `add_rbac_system`). `PermissionsService` tra permission theo role (1 query join, cache TTL ngắn). [RbacAdminController](src/modules/permission/presentation/controllers/rbac-admin.controller.ts): `GET /admin/roles`, `GET /admin/roles/:id`, `GET /admin/permissions`, `GET /admin/roles/:id/permissions`, `PUT /admin/roles/:id/permissions` (yêu cầu permission `role:permission:manage`) — đổi quyền của 1 role không cần deploy lại code. Mọi controller trong hệ thống đã gắn `@RequirePermissions(...)` + `PermissionGuard` (wiring hoàn tất, không còn route nào chỉ dựa vào `@Roles()`/role enum thô). Seed idempotent: `prisma/seed.ts` (`npm run db:seed`).

## 4a. Vận hành: deploy AWS EC2, logging, rate limit

Đây là phần hạ tầng/vận hành đã xuất hiện trong code (khác với "infra làm sau" ghi ở đầu roadmap — phần này ghi lại để không lệch thực tế):

- **Deploy target: 1 AWS EC2 instance chạy liên tục (Docker), không phải Lambda.**
  Từng thử qua Lambda (API Gateway + `src/lambda.ts`) rồi ECS Fargate + ALB, nhưng module `chat` dùng Socket.IO WebSocket thật (kết nối lâu dài) không sống được qua model mỗi-invocation-riêng của Lambda, và ALB luôn tốn phí cố định dù traffic thấp — nên chốt lại 1 EC2 `t3.micro` chạy image Docker trực tiếp, rẻ và đơn giản hơn ở quy mô này. Chi tiết: `DEPLOY.md` (repo này) + repo riêng `recruitment-platform-infra` (Terraform).
  - `src/lambda.ts` và `src/handlers/` (Lambda handlers cho cron) đã bị **xoá hẳn** — không còn dùng.
  - [src/bootstrap.ts](src/bootstrap.ts): `createHttpApp()` dùng chung cho `main.ts` — không còn `createAppContext()` (chỉ tồn tại để phục vụ các Lambda handler không-HTTP, đã xoá cùng lúc).
  - Cron quay lại **in-process `@nestjs/schedule`**: [close-expired-jobs.cron.ts](src/modules/job/application/jobs/close-expired-jobs.cron.ts) (`EVERY_HOUR`) và [job-alert-digest.cron.ts](src/modules/job-alert/application/jobs/job-alert-digest.cron.ts) (`0 7 * * *`) — mỗi cron chỉ inject `CommandBus` rồi dispatch command sẵn có, business logic không đổi.
- **Rate limit quay lại in-memory** (`@nestjs/throttler` mặc định, `ThrottlerModule.forRoot(...)` trong `app.module.ts`): thư mục `src/common/rate-limit/` (DynamoDB-backed `ThrottlerStorage`) đã bị xoá. Lý do tồn tại ban đầu — Lambda mỗi invocation có thể là 1 execution environment riêng, không chia sẻ memory — không còn áp dụng khi chạy 1 process EC2 duy nhất; đếm bằng `Map` trong process là đủ và không cần thêm 1 bảng DynamoDB + IAM permission cho vấn đề đã không còn tồn tại.
- **Structured logging** (`nestjs-pino` + `pino-http`, cấu hình ở [logger.config.ts](src/common/config/logger.config.ts)): mỗi request có 1 `requestId` (lấy từ header `x-request-id` nếu FE/gateway gửi sẵn, không thì tự sinh UUID) — cùng 1 id nối access log, mọi app log phát sinh lúc xử lý request, và error log ở `GlobalExceptionFilter`. Tự động redact `password`/`refreshToken`/header `authorization`/`cookie`... trước khi log. Dev: pretty-print màu qua `pino-pretty`; production: JSON thuần. Route `GET /api/v1/healthcheck` bị loại khỏi access log tự động (tránh spam log từ health check định kỳ).
  - ⚠️ **Lưu ý phát hiện khi rà soát**: `AppController` ([app.controller.ts](src/app.controller.ts), route `healthcheck`) hiện **không được khai báo trong `controllers: []` của `AppModule`** ([app.module.ts](src/app.module.ts)) — endpoint `/api/v1/healthcheck` vì vậy đang không thực sự tồn tại dù code và cấu hình logger đều giả định nó có. Cần thêm `AppController` vào `controllers` của `AppModule` (hoặc 1 module riêng) nếu muốn dùng làm health check thật cho ALB/EventBridge/uptime monitor.

## 5. Luồng nghiệp vụ chính (happy path)

1. **Đăng ký/xác thực:** Candidate/Recruiter `register` → nhận `verifyCode` qua email → `verify` → tài khoản ACTIVE → `login` nhận access/refresh token.
2. **Candidate:** tạo `Profile`, tạo `Cv` (thêm experience/education/skill) → `publish` CV → tìm `Job` (`GET /jobs` filter) → `apply` (chọn CV) → theo dõi trạng thái đơn qua `my-applications`, có thể `bookmark` job quan tâm.
3. **Recruiter:** tạo `Job` → nhận danh sách ứng viên qua `job-applications/job/:jobId` → `updateStatus` (ACCEPTED/REJECTED).
4. **Admin:** `admin/users` để xem và khoá/mở tài khoản, đổi role.

## 6a. Testing (P8, 2026-09-02)

- Unit test: `cv.entity.spec.ts`, `job.entity.spec.ts` (domain rule, throw exception), `register.use-case.spec.ts`, `login.use-case.spec.ts`, `apply-job.use-case.spec.ts` (mock repository) — 36 test.
- E2E test (`test/app.e2e-spec.ts`): luồng thật register → verify → login → tạo company/job → tạo+publish CV → apply job, chạy trên DB thật (mail provider override bằng stub, không gửi mail thật) — 5 test.
- Sửa Jest config: thiếu `moduleNameMapper` cho alias `@/` (chưa từng chạy được test nào trước đó); `test/jest-e2e.json` có `rootDir: "."` nhưng bị tính tương đối theo thư mục chứa file config (`test/`) chứ không phải project root — sửa thành `".."`.
- **Bug ESM phát hiện qua việc chạy test thật**: `uuid` v13 và `@nestjs/event-emitter` v12, `@nestjs/schedule` v12 đều khai báo `"type": "module"` (ESM thuần) — Jest (CommonJS runtime) không thể `require()` được dù cấu hình transform, vì đây là giới hạn kỹ thuật của Node (không sync-require ESM). Fix: bỏ `uuid`, dùng `crypto.randomUUID()` built-in; downgrade `@nestjs/event-emitter` → 3.1.0 và `@nestjs/schedule` → 6.1.3 (cả hai vẫn tương thích Nest 11, chỉ khác ở bản CJS).
- **Bug nghiêm trọng phát hiện qua e2e test**: `AuthUserAdapter.save()` không forward `id` khi update user hiện có — khiến `VerifyEmailUseCase`, `ResetPasswordUseCase`, `ChangePasswordUseCase`, `ForgotPasswordUseCase` (tất cả gọi `IAuthUserRepositoryPort.save(user)` để update) vô tình tạo user MỚI trùng email thay vì update, gây lỗi unique constraint. Đã fix bằng cách thêm `id?: string` vào `CreateUserOptions` và forward qua adapter.
- **Cập nhật số liệu (2026-09-03)**: sau CQRS refactor + thêm module `chat`/`interview`/`permission`, các file `*.use-case.spec.ts` cũ đã đổi tên/nội dung theo CQRS (`*.command.spec.ts`/`*.handler.spec.ts`). Chạy `npm test` hiện tại: **14 test suite / 85 test, pass 100%**. E2E vẫn 2 file — `test/app.e2e-spec.ts` (~6 test, luồng gốc) và `test/chat.e2e-spec.ts` (~8 test, thêm sau khi chat implement) — chưa re-run trong lần rà soát này (cần `DATABASE_URL` thật).

## 6. Bug đã fix (2026-09-02, phát hiện khi test end-to-end)

- **`JwtStrategy` trả sai field**: `validate()` trả `{ userId, email, role }` nhưng 19/21 chỗ dùng `@GetMe('id')` để lấy user hiện tại — nghĩa là gần như mọi endpoint có xác thực (tạo CV, tạo job, apply job, bookmark, update profile...) đều nhận `undefined`. Đã đổi `JwtStrategy` trả về `id` thay vì `userId`, và sửa 2 chỗ còn lại trong `auth.controller.ts` (`change-password`, `logout`) dùng `req.user.id`.
- **`prisma.config.ts`** thiếu `import 'dotenv/config'` nên CLI Prisma (`db push`/`generate`) không đọc được `.env`.
- **Prisma 7 đổi engine mặc định** sang "client" engine (WASM + driver adapter bắt buộc) — đã cài `@prisma/adapter-pg` + `pg`, sửa `PrismaService` truyền `adapter: new PrismaPg({ connectionString: ... })` vào `PrismaClient`.

## 7. Điểm cần lưu ý khi phát triển tiếp

- Toàn bộ business rule nằm trong domain entity (không phải ở service/controller) — khi thêm rule mới, sửa entity trong `domain/entities`, không sửa command/query handler.
- Muốn thêm hành vi nghiệp vụ mới cho 1 module: tạo thêm 1 `Command`/`Query` + 1 `Handler` tương ứng trong `application/commands|queries/` (không phình to handler cũ), đăng ký handler vào `providers` của `*.module.ts` (Nest tự inject vào `CommandBus`/`QueryBus` qua `@CommandHandler`/`@QueryHandler`), wire command/query mới vào controller.
- Soft-delete dùng field `deletedAt` (Cv, Job) — khi query cần tự lọc `deletedAt: null` ở tầng infrastructure/repository.
- Không có test hiện hữu trong `src/` (chỉ có cấu hình jest trong `package.json` và thư mục `test/` cho e2e) — cần viết thêm nếu muốn coverage.
- `dist/` là build output (đã build sẵn) — không sửa trực tiếp, chỉ sửa `src/`.
