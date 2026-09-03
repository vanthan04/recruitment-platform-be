# Recruitment Platform — Roadmap phần còn thiếu (chỉ tính năng/code)

> Infra/DevOps (Docker, CI/CD, seed automation) làm sau, không nằm trong roadmap này. **Ngoại lệ**: deploy đã chuyển sang AWS Lambda + EventBridge Scheduler (xem P11) — phần này landed trong code nên ghi lại ở đây dù ban đầu định để sau; Docker/CI/CD vẫn chưa có.
> Xem kiến trúc & module hiện có tại [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md).

Thứ tự phase là thứ tự nên làm (phase sau có thể phụ thuộc phase trước, đặc biệt P1 đổi schema `Job`).

---

## P1 — Company module ✅ (đã implement ở code, chưa migrate DB)

**Vì sao trước tiên:** `Job.company` hiện chỉ là `String` tự do. Đây là thay đổi schema ảnh hưởng module `job`, nên làm trước khi các phase khác build thêm lên trên.

**Schema (`prisma/schema.prisma`):**
- Model `Company`: `id, name, slug, logoUrl, description, website, industry, size (enum nhỏ: 1-10/11-50/51-200/200+), address, createdAt, updatedAt, deletedAt`.
- `Company` 1-N `User` (những user role RECRUITER thuộc 1 company) — thêm `companyId String?` vào `User`, hoặc tạo bảng join nếu 1 recruiter có thể thuộc nhiều company (khuyến nghị: 1-N đơn giản trước).
- `Job.company` (String) → `Job.companyId` (FK tới `Company`), migrate dữ liệu cũ nếu có.

**Module mới `src/modules/company/`** (theo đúng pattern domain/application/infrastructure/presentation đang dùng):
- `domain/entities/company.entity.ts` — business rule: `ensureOwner`, `softDelete`, validate slug unique.
- `domain/repositories/company.repository.ts` (interface).
- `application/use-cases/`: `create-company`, `update-company`, `get-company`, `list-companies` (public, có search), `delete-company`.
- `infrastructure/persistence/prisma/company-prisma.repository.ts` + mapper.
- `presentation/controllers/company.controller.ts`:
  - `POST /companies` (RECRUITER, tạo company của mình)
  - `GET /companies` (public, list + search theo tên/industry)
  - `GET /companies/:id` (public, kèm danh sách job đang OPEN của company)
  - `PATCH /companies/:id` (owner only)

**Việc cần sửa ở module `job`:**
- `Job` entity: đổi `company: string` → `companyId: string`.
- `CreateJobDto`/`UpdateJobDto`: bỏ field `company` tự do, lấy `companyId` từ recruiter (hoặc tự suy ra từ `user.companyId`).
- `JobResponseMapper`: join thêm thông tin company (tên, logo) khi trả về job list/detail.
- `SearchJobDto`: thêm filter `companyId`.

---

## P2 — Tự động hoá lifecycle của Job ✅ (đã implement + test)

**Vì sao dễ làm:** domain method `open()/close()/reopen()` đã có sẵn trong [job.entity.ts](src/modules/job/domain/entities/job.entity.ts), chỉ thiếu wiring.

- Cài `@nestjs/schedule`, import `ScheduleModule.forRoot()` vào `AppModule`.
- Tạo `application/jobs/close-expired-jobs.cron.ts` trong module `job`: `@Cron(CronExpression.EVERY_HOUR)` → query job `status=OPEN AND expiresAt < now()` → gọi `job.close()` qua repository, bulk update.
- Thêm 2 endpoint recruiter tự thao tác (đang thiếu ở controller dù domain đã hỗ trợ):
  - `PATCH /jobs/:id/close`
  - `PATCH /jobs/:id/reopen`

---

## P3 — Taxonomy: Category / Industry / Skill chuẩn hoá ✅ (Category + Level đã implement + test, Skill dùng chung để sau)

**Hiện trạng:** search job chỉ match keyword tự do; `Skill` trong CV là free-text (không liên kết gì tới job).

- Schema: model `Category` (`id, name, slug`) — gắn `Job.categoryId`.
- Thêm enum hoặc model `JobLevel` (INTERN/FRESHER/JUNIOR/MIDDLE/SENIOR/MANAGER) → field `Job.level`.
- Module `category/` (nhỏ, chủ yếu CRUD cho ADMIN + list công khai cho FE làm dropdown filter).
- `SearchJobDto` + `ListJobsUseCase`: thêm filter `categoryId`, `level`.
- (Tuỳ chọn, có thể để P3.5 riêng): chuẩn hoá `Skill` thành bảng `Skill` dùng chung giữa CV và Job (`Job.requiredSkills: Skill[]`) để sau này match CV↔Job tự động — nếu không cần match tự động thì giữ free-text cũng được, không bắt buộc.

---

## P4 — Notification & Job Alert (in-app, chưa cần push/real-time) ✅ (Notification core đã implement + test; Job Alert/SavedSearch để sau, xem P4.5 bên dưới)

- Schema: model `Notification` (`id, userId, type, title, message, isRead, metadata Json?, createdAt`).
- Module `notification/`:
  - `use-cases`: `create-notification` (dùng nội bộ, gọi từ event listener), `list-my-notifications`, `mark-as-read`.
  - Controller: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.
  - Lắng nghe event có sẵn: `JobAppliedEvent` (thông báo cho recruiter "có ứng viên mới"), thêm event mới `ApplicationStatusChangedEvent` (thông báo cho candidate "đơn được duyệt/từ chối") — phát ra từ [update-application-status.use-case.ts](src/modules/application/application/use-cases/update-application-status.use-case.ts).
### P4.5 — Job Alert ✅ (đã implement + test CRUD; cron gửi mail chưa live-test vì dùng Gmail thật trong .env)
- Model `SavedSearch` (`userId, keyword, location, categoryId, jobType, createdAt`).
- Cron hằng ngày: chạy từng saved search, tìm job mới tạo trong 24h khớp điều kiện → gửi mail qua `MailModule` có sẵn.

---

## P5 — CV nâng cao ✅ (đã implement + test)

- **Upload CV có sẵn:** tận dụng `file-upload` module đã có — thêm field `Cv.fileUrl` (nullable) trong schema, cho phép candidate upload PDF/DOCX thay vì (hoặc kèm) CV structured. Thêm use-case `upload-cv-file` gọi `FileUploadService` có sẵn.
- **Export PDF:** thêm use-case `export-cv-pdf` dùng thư viện render HTML→PDF (vd. `puppeteer` hoặc `pdf-lib`/`@react-pdf/renderer` tuỳ độ phức tạp mong muốn) từ dữ liệu structured CV hiện có → trả về file qua endpoint `GET /cvs/:id/export`.

---

## P6 — Ứng tuyển nâng cao ✅ (đã implement + test)

- **Rút đơn ứng tuyển:** thêm use-case `withdraw-application`, domain method `JobApplication.withdraw()` (chỉ khi status PENDING), endpoint `DELETE /job-applications/:id` hoặc `PATCH /job-applications/:id/withdraw` (candidate, chỉ owner).
- **Thống kê cho recruiter:** use-case `get-job-stats` (đếm application theo status cho 1 job), có thể thêm field đếm `viewCount` trên `Job` + tăng mỗi lần `GetJobUseCase.execute` chạy (cẩn thận: tăng bất đồng bộ, không block response).

---

## P7 — Application-level hardening (vẫn là code, không phải infra) ✅ (cả 4 mục đã implement + test)

- `main.ts`: thêm `app.enableCors({...})` (hiện chưa cấu hình gì → mặc định NestJS chặn cross-origin).
- `@nestjs/throttler`: `ThrottleModule.forRoot()` + `@Throttle()` cho các endpoint nhạy cảm (`login`, `register`, `forgot-password`) chống brute-force.
- `FileUploadController`: thêm `ParseFilePipeBuilder` (hoặc `FileValidator` tự viết) giới hạn kích thước (vd. 5MB) và whitelist mimetype (`image/*`, `application/pdf`) trước khi gọi `S3StorageProvider.upload`.
- Refresh token: cân nhắc đổi từ "1 refresh token duy nhất/user" (đang lưu field `User.refreshToken`) sang bảng `RefreshToken` riêng nếu muốn hỗ trợ đăng nhập nhiều thiết bị + "đăng xuất tất cả thiết bị".

---

## P8 — Testing ✅ (đã implement + chạy pass 41/41)

- Unit test cho domain entity thuần logic (không cần mock nhiều): `cv.entity.spec.ts`, `job.entity.spec.ts` — test `publish()`, `ensureOwner()`, các rule throw exception.
- Unit test cho use-case quan trọng (mock repository): `register.use-case.spec.ts`, `login.use-case.spec.ts`, `apply-job.use-case.spec.ts`.
- Sửa `test/app.e2e-spec.ts` — hiện test `GET /` nhưng app không có route này (chỉ có `/api/v1/...`), test sẽ fail nếu chạy thật. Viết lại e2e cho luồng `register → verify → login → create CV → publish → apply job`.

---

## P9 — Chat (Realtime) ✅ (đã implement, retroactive — không có trong roadmap gốc)

**Ghi chú:** phase này được thêm sau khi rà soát code — module đã code xong nhưng chưa từng được liệt kê ở đây. Thêm vào để roadmap khớp thực tế, không phải việc cần làm.

- Model `Conversation`/`Message`/`ConversationMember`/`MessageAttachment`, gắn `applicationId`/`jobId` để biết conversation thuộc application/job nào.
- `ChatGateway` (namespace `/ws`) qua `ChatIoAdapter` ([socket-io.adapter.ts](src/common/adapters/socket-io.adapter.ts)) — auth bằng cookie, rate-limit gửi tin.
- REST: `POST/GET /conversations`, `GET /conversations/:id`, `GET /conversations/:id/messages` (cursor-paginated), `POST /conversations/:id/messages`, `POST /conversations/:id/read`, `PATCH/DELETE /messages/:id`.
- WS events: `conversation:subscribe/unsubscribe`, `message:send/ack/new/error/read`, `typing:start/stop`, `user:online/offline`.
- `ChatPresenceService` + `ChatEventsListener`, ports `IChatJobLookupPort`/`IChatApplicationLookupPort`/`IChatUserLookupPort` để tách phụ thuộc sang module `job`/`application`/`user`.

---

## P10 — Interview Scheduling ✅ (đã implement + test)

Recruiter đặt/dời/huỷ lịch phỏng vấn cho 1 `JobApplication`; candidate được gửi email ở cả 3 hành động (lần đầu tiên có luồng "đổi trạng thái application → gửi email" trong hệ thống — trước đây `notification` module chỉ tạo thông báo in-app, chưa từng gọi mail).

- Schema: model [`InterviewSchedule`](prisma/schema.prisma) — `id, jobApplicationId (FK JobApplication), scheduledAt, location?, meetingLink?, note?, status (SCHEDULED/RESCHEDULED/CANCELLED), createdById (recruiter), createdAt/updatedAt`. Bắt buộc có ít nhất 1 trong 2 field `location`/`meetingLink` (validate ở domain entity) — `location` cho phỏng vấn trực tiếp, `meetingLink` cho online (recruiter tự dán link Meet/Zoom thủ công, hệ thống không tự sinh link).
- Module mới [`src/modules/interview/`](src/modules/interview/) theo đúng khuôn domain/application/infrastructure/presentation, với 3 port cục bộ (`IInterviewJobLookupPort`, `IInterviewApplicationLookupPort`, `IInterviewUserLookupPort`) bọc `JobModule`/`JobApplicationModule`/`UserModule` — cùng pattern `IJobLookupPort` của module `application`.
- Commands: `ScheduleInterviewCommand`, `RescheduleInterviewCommand`, `CancelInterviewCommand` (CQRS, owner check `job.postedById !== recruiterId` → `UnauthorizedDomainException`, giống [UpdateApplicationStatusHandler](src/modules/application/application/commands/update-application-status.command.ts)). Query: `ListInterviewsByApplicationQuery` (candidate chủ đơn hoặc recruiter chủ job mới xem được).
- Endpoint (role RECRUITER, trừ list): `POST /interviews`, `PATCH /interviews/:id`, `PATCH /interviews/:id/cancel`, `GET /interviews/application/:applicationId` (CANDIDATE + RECRUITER).
- Email: gọi thẳng `IMailService.sendEmail(...)` trong command handler (đồng bộ, không qua event — khớp pattern duy nhất đang có ở [register.command.ts](src/modules/auth/application/commands/register.command.ts)), nội dung build động theo field nào có (`location`/`meetingLink`/`note`).
- Test: [`interview-schedule.entity.spec.ts`](src/modules/interview/domain/entities/interview-schedule.entity.spec.ts).
- **Chưa làm** (out of scope lần này, có thể làm sau riêng): không thêm in-app notification (`NotificationType` enum) cho interview; không đính kèm file `.ics`.

---

## P11 — CQRS toàn bộ + RBAC wiring + deploy AWS Lambda ✅ (đã implement, retroactive — không có trong roadmap gốc)

**Ghi chú:** giống P9, phase này được thêm sau khi rà soát code (2026-09-03) — đã implement xong nhưng chưa từng liệt kê ở đây. Gồm cả phần "infra" mà đầu file ghi là "làm sau" — thực tế đã bắt đầu, ghi lại để roadmap khớp thực tế.

- **CQRS hoá toàn bộ**: mọi use-case cũ (16 module) đã chuyển thành `Command`/`Query` + `Handler` qua `@nestjs/cqrs` (`CommandBus`/`QueryBus`) — không còn file `*.use-case.ts` nào trong `src/`. Đây cũng chính là Phase 1 trong [MICROSERVICES_MIGRATION_PLAN.md](MICROSERVICES_MIGRATION_PLAN.md).
- **Exception per-module**: mọi module có `domain/exceptions/<module>.exceptions.ts` riêng, không còn raw NestJS exception (xem tech debt #3 phía dưới, đã đánh dấu done).
- **RBAC wiring hoàn tất**: mọi controller đã gắn `@RequirePermissions` + `PermissionGuard`.
- **Decouple thêm cho `job`/`company`/`chat`/`notification`** hướng tới microservice-readiness (port/adapter chặt hơn giữa các module này).
- **Deploy chuyển sang AWS Lambda** (khác hẳn giả định "chạy Node server liên tục" ở phần Getting Started cũ):
  - [src/lambda.ts](src/lambda.ts) — API Gateway → Lambda qua `@codegenie/serverless-express`.
  - Cron cũ (`@nestjs/schedule`) bỏ hẳn — thay bằng AWS EventBridge Scheduler gọi 2 Lambda riêng trong [src/handlers/](src/handlers/) (`close-expired-jobs.handler.ts`, `job-alert-digest.handler.ts`), mỗi handler chỉ boot application context (không HTTP) rồi dispatch CQRS command có sẵn.
  - Rate limit chuyển từ in-memory sang DynamoDB (`DynamoThrottlerStorage`, fail-open khi DynamoDB lỗi) — bắt buộc vì Lambda không có memory dùng chung giữa các invocation.
  - Structured logging (`nestjs-pino`/`pino-http`) với `requestId` xuyên suốt access log/app log/error log, redact secret, healthcheck route loại khỏi access log.
- **Việc dở dang phát hiện khi rà soát**: `AppController` (`/healthcheck`) hiện chưa được đăng ký vào `controllers` của `AppModule` — xem chi tiết ở [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md#4a-vận-hành-deploy-aws-lambda-logging-rate-limit). Nên fix trước khi dùng route này làm health check thật cho EventBridge/monitor.

---

## Tech debt backlog (chưa xử lý)

Ghi nhận để theo dõi, chưa sửa code lần này. Ưu tiên theo Impact/Risk/Effort (effort thấp = dễ làm trước):

1. ~~**Test coverage thấp (~4-5% file coverage)** — 9 module hoàn toàn không có `.spec.ts`~~ ✅ **Đã fix** (2026-09-04) — thêm spec cho command/query handler + domain entity của cả 9 module (`bookmark`, `category`, `company`, `file-upload`, `job-alert`, `mail`, `notification`, `prisma`, `user`), cộng thêm `s3-storage.provider.ts` (mock `@aws-sdk/client-s3`, test cả 2 nhánh trích key khi delete + URL custom endpoint). Tổng 30 file spec mới, 128 test case mới (170/170 pass toàn repo). Còn thiếu: test cho controller/presentation layer — bỏ qua có chủ đích vì controller ở đây chỉ wire `CommandBus`/`QueryBus` + `ApiResponse.ok(...)`, gần như không có logic để test.
2. ~~**Không có CI/CD, Dockerfile, docker-compose**~~ ✅ Đã có từ trước (xem git history: `docker-compose.yml`, `Dockerfile`, `.github/workflows/ci.yml`, `deploy.yml`) — ghi chú "làm sau" ở đầu file này đã lỗi thời, chỉ còn việc apply Terraform ở `recruitment-platform-infra` (ngoài phạm vi roadmap này).
3. ~~**Exception xử lý không nhất quán**~~ ✅ **Đã fix** (rà soát 2026-09-03) — mọi module (kể cả `auth`, `user`, `file-upload`) giờ đều có exception riêng trong `domain/exceptions/<module>.exceptions.ts` kế thừa `DomainException` con, không còn ném raw NestJS exception nữa.
4. ~~**Nhiều file bypass `ConfigService`**, đọc thẳng `process.env`~~ ✅ **Đã fix** (2026-09-04) — [socket-io.adapter.ts](src/common/adapters/socket-io.adapter.ts) đọc `CORS_ORIGIN` qua `app.get(ConfigService)`; [jwt.strategy.ts](src/common/strategies/jwt.strategy.ts) và [prisma.service.ts](src/modules/prisma/prisma.service.ts) nhận `ConfigService` làm tham số constructor (đọc trước khi gọi `super()`, vì `this` chưa tồn tại lúc đó); `main.ts` đọc `PORT` qua `app.get(ConfigService)`; [ws-auth.util.ts](src/modules/chat/infrastructure/gateways/ws-auth.util.ts) bỏ hẳn `secret` truyền tay, dùng secret đã cấu hình sẵn trên `JwtService` qua `JwtModule.registerAsync` trong `chat.module.ts`. Ngoại lệ vẫn giữ nguyên (không đổi): [logger.config.ts](src/common/config/logger.config.ts), `bootstrap.ts`, `app.config.ts` đọc `process.env` vì chạy trước khi/là nguồn của `ConfigService`.
5. **Trùng logic pagination** ✅ **Đã fix phần pagination** (2026-09-04) — 6 chỗ tự viết `const skip = (page - 1) * limit` (`chat`, `company`, `job` ×2, `notification`, `user`) giờ dùng chung `normalizePagination()` từ `pagination.util.ts`. **Ownership-check giữ nguyên, có chủ đích** — `Company.ensureOwner`/`Job.ensureOwner`/`Cv.ensureOwner` đã là method domain-entity đúng chuẩn DDD (invariant nằm trong aggregate); các chỗ còn lại (`apply-job.command.ts`, `withdraw-application.command.ts`, `job-alert`, `notification`) so sánh field trên DTO/port-result chứ không phải entity nên không có gì để gắn method — ép về 1 helper generic `ensureOwner(a, b, exception)` sẽ giảm rõ ràng hơn là tăng, nên không làm.
6. ~~**Dependency version bất thường**~~ ✅ **Đã xác minh, không phải lỗi** (2026-09-04) — check `npm view` live: `prisma` bản mới nhất là `8.0.0-rc.12` (stable gần nhất là dòng 7.x), `joi` mới nhất `18.2.8`, `nodemailer` mới nhất `9.1.1`. Repo ghim `prisma@7.7.0`, `joi@18.1.2`, `nodemailer@8.0.5` — đều là bản thật, không phải canary/gõ nhầm, chỉ là đánh giá cũ (trước 2026) đã lỗi thời. Không cần đổi gì.
7. ~~**Dependency chết**~~ ✅ Đã gỡ từ trước — `@nestjs-modules/mailer` và `@aws-sdk/client-ses` không còn trong `package.json`.

---

## Việc nhỏ (dọn dẹp, làm xen kẽ lúc nào tiện)
- ~~Xoá import thừa `SwaggerResponse` trong `auth.controller.ts`~~ ✅ Đã gỡ từ trước.
- ~~Thống nhất ngôn ngữ message trả về~~ ✅ **Đã fix** (2026-09-04) — toàn bộ response message, exception message, mail subject/content, và validation message trong `auth`/`user` chuyển sang tiếng Anh, khớp với `cv`/`job`/`bookmark`/`application`. Còn 1 chỗ cố ý giữ nguyên: `@ApiPropertyOptional({ example: 'Nguyễn Văn A' })` trong `update-profile.dto.ts` — đó là dữ liệu ví dụ minh hoạ, không phải message hệ thống.

---

## Gợi ý thứ tự thực hiện nếu làm 1 phase/tuần
1. P1 (Company) — nền tảng, đổi schema sớm để đỡ migrate lại nhiều lần.
2. P2 (Job lifecycle) — nhanh, tận dụng code có sẵn.
3. P7 (hardening) — rẻ, nên làm sớm trước khi có user thật dùng thử.
4. P3 (Taxonomy) → P6 (Application nâng cao) → P5 (CV nâng cao) → P4 (Notification) — theo độ ưu tiên trải nghiệm.
5. P8 (Testing) — làm song song, thêm test ngay khi viết code mới ở mỗi phase thay vì dồn cuối.
