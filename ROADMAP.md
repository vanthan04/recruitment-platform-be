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
