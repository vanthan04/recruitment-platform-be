# Recruitment Platform — Roadmap phần còn thiếu (chỉ tính năng/code)

> Infra/DevOps (Docker, CI/CD, deploy, seed automation) làm sau, không nằm trong roadmap này.
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

## P10 — Interview Scheduling (đề xuất, **chưa code**)

**Vì sao khả thi:** hạ tầng mail (`IMailService` port + `NodemailerMailProvider`, [mail module](src/modules/mail/)) và pattern use-case CQRS (theo [UpdateApplicationStatusHandler](src/modules/application/application/commands/update-application-status.command.ts)) đã có sẵn để mô phỏng theo — không cần dựng infra mới, chỉ cần thêm 1 module theo đúng khuôn hiện có.

**Thiết kế đề xuất (chưa implement):**
- Schema mới: model `InterviewSchedule` — `id, jobApplicationId (FK JobApplication), scheduledAt, location/meetingLink, note, status (SCHEDULED/RESCHEDULED/CANCELLED), createdBy, createdAt/updatedAt`.
- Use-case (CQRS, giống pattern `update-application-status.command.ts`):
  - `ScheduleInterviewCommand` — recruiter tạo lịch, owner check giống hiện tại (`job.postedById !== recruiterId` → `UnauthorizedDomainException`), not-found → `EntityNotFoundException`.
  - `RescheduleInterviewCommand`, `CancelInterviewCommand`.
- Endpoint mới (role RECRUITER), ví dụ `POST /job-applications/:id/interview`, `PATCH /interviews/:id`, `DELETE /interviews/:id`.
- **Email tới candidate**: gọi `IMailService.sendEmail(...)` sau khi tạo/sửa lịch — đây sẽ là **lần đầu tiên** có luồng "đổi trạng thái application → gửi email", vì hiện tại `notification` module khi nhận event `application.status_changed` chỉ tạo thông báo in-app, chưa từng gọi mail. Nội dung email build inline HTML (chưa có template engine, giống cách [register.command.ts](src/modules/auth/application/commands/register.command.ts)/[forgot-password.command.ts](src/modules/auth/application/commands/forgot-password.command.ts) đang làm).
- Có thể phát thêm event `interview.scheduled` để `notification` module tạo luôn in-app notification song song với email, tái dùng pattern `ApplicationEventsListener` hiện có.
- Không bắt buộc nhưng nên cân nhắc: đính kèm file `.ics` (cần thêm dependency `ics`/`ical-generator`, hiện chưa có trong `package.json`).

---

## Tech debt backlog (chưa xử lý)

Ghi nhận để theo dõi, chưa sửa code lần này. Ưu tiên theo Impact/Risk/Effort (effort thấp = dễ làm trước):

1. **Test coverage thấp (~4-5% file coverage)** — 9 module hoàn toàn không có `.spec.ts`: `bookmark`, `category`, `company`, `file-upload`, `job-alert`, `mail`, `notification`, `prisma`, `user`. Impact/Risk cao, effort trung bình — nên ưu tiên thêm spec cho use-case quan trọng (auth, application, job) trước khi phủ hết.
2. **Không có CI/CD, Dockerfile, docker-compose** (ghi chú ở đầu file này là "làm sau" — liệt kê lại đây để không bị quên). Impact/Risk cao khi deploy, effort thấp-trung bình.
3. **Exception xử lý không nhất quán** — `auth`, `user`, `file-upload` ném raw NestJS exception (`NotFoundException`, `UnauthorizedException`...) thay vì `DomainException` con như `job`/`cv`/`application`/`company` đang dùng. Impact trung bình, effort thấp.
4. **6 file bypass `ConfigService`**, đọc thẳng `process.env`: [socket-io.adapter.ts](src/common/adapters/socket-io.adapter.ts), [jwt.strategy.ts](src/common/strategies/jwt.strategy.ts), `main.ts` (2 chỗ), [ws-auth.util.ts](src/modules/chat/infrastructure/gateways/ws-auth.util.ts), [prisma.service.ts](src/modules/prisma/prisma.service.ts) — bỏ qua schema Joi đã validate ở `env.validation.ts`. Impact thấp-trung bình, effort thấp.
5. **Trùng logic pagination/ownership-check** — chỉ 1 module dùng `pagination.util.ts` dùng chung, các module khác (`job`, `company`, `chat`, `notification`, `user`) tự viết `skip`/`take` riêng; ownership check (`x.userId !== userId`) lặp lại ở 7+ chỗ thay vì 1 helper `ensureOwner` dùng chung. Impact thấp, effort trung bình (refactor rải rác nhiều file).
6. **Dependency version bất thường, cần xác nhận chủ đích**: `@prisma/*` ghim `^7.x`, `joi ^18`, `nodemailer ^8` — cao bất thường so với bản ổn định phổ biến (Prisma v5/v6, Joi v17, nodemailer v6). Nên xác nhận không phải version canary/gõ nhầm trước khi deploy production.
7. **Dependency chết** — `@nestjs-modules/mailer` và `@aws-sdk/client-ses` có trong `package.json` nhưng không được import ở đâu trong `src/` (mail hiện chỉ dùng `nodemailer` thuần). Cân nhắc gỡ nếu không có kế hoạch dùng.

---

## Việc nhỏ (dọn dẹp, làm xen kẽ lúc nào tiện)
- Xoá import thừa `SwaggerResponse` trong [auth.controller.ts](src/modules/auth/presentation/controllers/auth.controller.ts) (import nhưng không dùng).
- Thống nhất ngôn ngữ message trả về (hiện `auth`/`user` tiếng Việt, `cv`/`job`/`bookmark`/`application` tiếng Anh) — chọn 1 chuẩn, không bắt buộc dùng thư viện i18n ngay.

---

## Gợi ý thứ tự thực hiện nếu làm 1 phase/tuần
1. P1 (Company) — nền tảng, đổi schema sớm để đỡ migrate lại nhiều lần.
2. P2 (Job lifecycle) — nhanh, tận dụng code có sẵn.
3. P7 (hardening) — rẻ, nên làm sớm trước khi có user thật dùng thử.
4. P3 (Taxonomy) → P6 (Application nâng cao) → P5 (CV nâng cao) → P4 (Notification) — theo độ ưu tiên trải nghiệm.
5. P8 (Testing) — làm song song, thêm test ngay khi viết code mới ở mỗi phase thay vì dồn cuối.
