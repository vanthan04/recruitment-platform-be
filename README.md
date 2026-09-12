# Job Portal Backend (Recruitment Platform)

Backend cho một job portal (ứng viên ứng tuyển việc làm, nhà tuyển dụng đăng tin và quản lý ứng viên), xây bằng **NestJS**, **Prisma**, **PostgreSQL**, theo **Domain-Driven Design (DDD)** và **Clean Architecture** — mỗi module tách theo 4 lớp `domain / application / infrastructure / presentation`, business logic nằm trong domain entity, không phụ thuộc framework.

## Tính năng

- **Auth** — JWT access + refresh token, xác thực email, quên/đổi mật khẩu, đăng nhập đa thiết bị (mỗi lần login là 1 phiên độc lập, có thể thu hồi riêng), logout (1 thiết bị) / logout-all (mọi thiết bị), rate-limit cho login/register/forgot-password. Đăng ký công khai chỉ nhận `CANDIDATE`/`RECRUITER`. Đăng nhập Google/Facebook OAuth (mã dùng-một-lần để đổi token, không bao giờ trả JWT thẳng trong URL redirect), `role` chỉ áp dụng khi tạo user mới. Cron hằng ngày dọn refresh/verification token đã hết hạn.
- **User** — quản lý profile cá nhân, admin xem danh sách + đổi status/role.
- **Company** — recruiter sở hữu 1 company (logo, quy mô, loại hình, địa chỉ/tỉnh/phường); phải có company **đang active** mới đăng job được (ràng buộc ở DB qua partial unique index trên `ownerId`, nên soft-delete rồi tạo lại vẫn hợp lệ). Nền tảng chỉ phục vụ ngành IT — không có field `industry`.
- **Category** / **Skill** — danh mục ngành nghề và bộ kỹ năng (nhiều-nhiều với job) do admin quản lý, dùng để lọc tìm kiếm; job còn có thể gắn `level` (INTERN → MANAGER).
- **Job** — CRUD, tìm kiếm công khai (keyword/địa điểm/loại hình/hình thức làm việc/level/category/company/lương/skill, tự loại các job đã quá `expiresAt` dù cron hàng giờ chưa kịp đóng), vòng đời (`DRAFT → OPEN → CLOSED`) với đóng/mở lại thủ công + cron hàng giờ tự đóng job hết hạn, đếm view từng job, mục "job của tôi" cho recruiter xem toàn bộ job của mình bất kể status.
- **CV** — mỗi CV là 1 file upload duy nhất (PDF/DOC/DOCX) kèm publish workflow; không còn form nhập cấu trúc, không xuất PDF. Chủ sở hữu hoặc recruiter có ứng viên nộp CV đó mới tải được, qua URL presigned ngắn hạn.
- **Application** — ứng tuyển bằng CV đã publish, xem đơn của mình / theo job (recruiter), chuyển trạng thái qua pipeline tuyển dụng 8 bước (`APPLIED → SCREENING → SHORTLISTED → INTERVIEW → OFFER → HIRED`, rẽ `REJECTED` ở mọi bước) kèm ghi chú tuỳ chọn, rút đơn trước khi tới trạng thái cuối, thống kê theo job (view count + phân bổ theo status) cho recruiter. Mỗi lần đổi trạng thái đều được ghi lại và đọc được qua endpoint lịch sử riêng của từng đơn.
- **Bookmark** — candidate lưu/bỏ lưu job.
- **Notification** — thông báo trong app (có ứng viên mới → recruiter, đổi trạng thái đơn → candidate), đánh dấu đã đọc / đọc tất cả.
- **Job Alert** — candidate lưu điều kiện tìm việc; cron hằng ngày gửi mail tổng hợp job mới phù hợp.
- **File upload** — upload ảnh/tài liệu chung lên S3-compatible storage, có kiểm tra kích thước và MIME type.
- **Admin** — xem/phân trang user, đổi status hoặc role.
- **RBAC (Permission)** — phân quyền role → permission dựa trên DB (`roles`/`permissions`/`role_permissions`); mọi route controller khai báo permission cần thiết qua `@RequirePermissions`, kiểm tra bởi `PermissionGuard` (có cache, đổi quyền không cần deploy lại); có endpoint admin để xem role/permission và thay toàn bộ permission của 1 role.
- **Chat** — hội thoại realtime giữa candidate và recruiter qua WebSocket (Socket.IO), gắn với 1 job/application (`applicationId`/`jobId`); gửi/sửa/xoá mềm tin nhắn, lịch sử phân trang kiểu cursor, đã đọc, đang gõ, trạng thái online, xác thực WS bằng cookie, giới hạn tốc độ gửi.
- **Interview scheduling** — recruiter đặt/dời/huỷ/hoàn thành/đánh dấu không đến buổi phỏng vấn cho 1 đơn ứng tuyển (địa điểm trực tiếp `location` và/hoặc `meetingLink` online, cần ít nhất 1 trong 2, `durationMinutes` tuỳ chọn); candidate được gửi email ở mọi thay đổi. Cả 4 hành động sau khi đặt lịch chỉ hợp lệ khi interview còn `SCHEDULED`/`RESCHEDULED` — interview đã `COMPLETED`/`NO_SHOW` không huỷ/dời lại được nữa.
- **AI Recruitment Agent** — 4 tính năng hỗ trợ recruiter, chỉ recommend/soạn draft, không tự động đổi dữ liệu: **tìm ứng viên phù hợp** cho 1 job (`POST /jobs/:jobId/matching-candidates`, agent LangGraph tự gọi tool để lọc + xếp hạng), **hỏi đáp AI về 1 ứng viên** (`.../candidates/:candidateId/screening-questions`), **gợi ý skill** từ taxonomy có sẵn cho job (`POST /jobs/skill-suggestions`), **soạn draft job posting** từ vài gợi ý (`POST /jobs/draft`). CV được phân tích cấu trúc (skills/kinh nghiệm/học vấn) bất đồng bộ ngay sau khi upload, dùng lại nhiều lần cho các lần tìm kiếm sau — không gửi lại toàn bộ file cho AI mỗi lần. Mỗi tính năng chọn provider AI riêng (Anthropic/OpenAI/Gemini) qua env, xem [API_GUIDE.md §4.14](API_GUIDE.md#414-ai-recruitment-agent-jobs-module-ai).

## Công nghệ sử dụng

| Thành phần | Lựa chọn |
|---|---|
| Framework | [NestJS 11](https://nestjs.com/) |
| ORM / DB | [Prisma 7](https://www.prisma.io/) (`@prisma/adapter-pg`) + PostgreSQL |
| Application layer | `@nestjs/cqrs` — mỗi hành động nghiệp vụ là 1 `Command`/`Query` + 1 `Handler`, dispatch qua `CommandBus`/`QueryBus` |
| Auth | `@nestjs/jwt`, `passport-jwt`, `bcrypt` |
| Authorization | RBAC dựa trên DB (`PermissionGuard` + `@RequirePermissions`, xem module `permission`) |
| Validation | `class-validator` / `class-transformer` |
| Events | `@nestjs/event-emitter` (pub/sub in-process cho notification) |
| Scheduled jobs | `@nestjs/schedule` (`@Cron`) — chạy in-process, mỗi job 1 class trong `application/jobs/` của module tương ứng |
| Rate limiting | `@nestjs/throttler`, `ThrottlerStorage` in-memory mặc định |
| Logging | `nestjs-pino` / `pino-http` — log JSON có cấu trúc, 1 `requestId` nối access log, mọi app log, và error log của cùng 1 request; tự động ẩn secret (mật khẩu, token, header auth/cookie); dev thì pretty-print, production thì JSON thuần |
| Deployment | 1 AWS EC2 instance chạy liên tục, chạy image Docker — xem [`DEPLOY.md`](DEPLOY.md) và repo riêng `recruitment-platform-infra` (Terraform) |
| File storage | AWS S3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) |
| Mail | `nodemailer` |
| Realtime | `socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io` |
| API docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Testing | Jest (unit) + Supertest (e2e) |

> Lưu ý: bản mới nhất của `uuid` là pure-ESM, Jest (CommonJS) không `require()` được — dự án dùng `crypto.randomUUID()` thay thế.

## Kiến trúc

Mỗi module nghiệp vụ trong `src/modules/<name>/` đều theo cùng 1 khuôn:

```
<module>/
├── domain/            # Entity, value object, interface repository, exception riêng — không import NestJS/Prisma
├── application/        # Command/Query + Handler (@nestjs/cqrs, mỗi hành động nghiệp vụ 1 cặp), DTO, mapper, port
├── infrastructure/      # Prisma repository impl, persistence mapper, adapter (implement port của module này, thường bằng cách bọc interface repository của module khác), event
├── presentation/        # Controller, request DTO, guard/strategy (nếu có)
└── <module>.module.ts
```

Phần dùng chung nằm ở `src/common/` (base entity, domain exception, phân trang, decorator, guard, global exception filter) và `src/modules/prisma/` (`PrismaService` dùng chung).

Chi tiết từng module xem **[CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md)**.

### Cấu trúc project

```
src/
├── common/          # Base entity, exception, guard, filter, decorator, phân trang dùng chung,
│                    # config/ (validate env, cấu hình pino logger)
├── modules/
│   ├── auth/            # JWT auth, phiên refresh-token, xác thực email, reset mật khẩu
│   ├── user/             # Quản lý profile + admin user
│   ├── permission/        # RBAC dựa trên DB (roles/permissions/role_permissions), endpoint admin
│   ├── company/          # Company của recruiter
│   ├── category/         # Danh mục ngành nghề (admin quản lý)
│   ├── skill/            # Bộ kỹ năng, nhiều-nhiều với job
│   ├── job/              # Đăng job, tìm kiếm, vòng đời, view count, application/jobs/ (cron đóng job hết hạn mỗi giờ)
│   ├── cv/               # CV chỉ dạng file (upload/download qua S3 presigned URL)
│   ├── application/      # Đơn ứng tuyển (apply/withdraw/pipeline status/thống kê)
│   ├── bookmark/         # Bookmark job
│   ├── notification/     # Thông báo trong app
│   ├── job-alert/        # Lưu điều kiện tìm việc; application/jobs/ (cron gửi digest mỗi ngày)
│   ├── file-upload/       # Upload file S3 chung
│   ├── mail/             # Mail provider (Nodemailer)
│   ├── chat/             # Hội thoại/tin nhắn realtime (Socket.IO gateway, presence)
│   ├── interview/         # Lịch phỏng vấn (đặt/dời/huỷ/hoàn thành/no-show, email candidate)
│   ├── ai/               # AI matching/screening/skill-suggestion/job-draft (LangGraph agent + tool)
│   └── prisma/           # PrismaService dùng chung
├── bootstrap.ts      # Setup app Nest dùng chung (helmet, prefix, validation pipe, Swagger, pino logger,
│                    # exception filter) — dùng trong main.ts
└── main.ts           # Entry point server (npm run start:dev / start:prod)
```

## Bắt đầu

### Yêu cầu

- Node.js 18+
- PostgreSQL (cài local hoặc bất kỳ instance nào truy cập được)

### Biến môi trường

Tạo file `.env` ở thư mục gốc project:

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `PORT` | không (mặc định `8080`) | Port HTTP |
| `DATABASE_URL` | có | `postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public` |
| `CORS_ORIGIN` | không | Danh sách origin được phép, cách nhau dấu phẩy; bỏ trống sẽ phản hồi mọi origin (tiện cho dev) |
| `JWT_SECRET` / `JWT_EXPIRATION` | có | Ký access token |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRATION` | có | Ký refresh token |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USER` / `MAIL_PASS` / `MAIL_FROM` | có | SMTP cho mail xác thực/reset/job-alert |
| `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | có | Lưu trữ file |
| `S3_ENDPOINT` | không | Set khi dùng provider tương thích S3 khác (vd. MinIO, R2) |
| `CV_MAX_FILE_SIZE` | không (mặc định `10485760`, tức 10MB) | Giới hạn nghiệp vụ cho CV upload, tính bytes (Multer có ceiling cứng 20MB) |
| `LOG_LEVEL` | không (mặc định `debug` ở dev, `info` ở prod) | `fatal`/`error`/`warn`/`info`/`debug`/`trace`/`silent` |
| `<CAPABILITY>_AI_PROVIDER` / `<CAPABILITY>_AI_MODEL` | không | 1 cặp cho mỗi tính năng AI (`MATCHING`/`CV_ANALYSIS`/`SCREENING`/`SKILL_SUGGESTION`/`JOB_DRAFT`) — provider là `anthropic`/`openai`/`google`, mỗi tính năng chọn độc lập. Thiếu key của provider đang chọn thì app vẫn chạy, chỉ tính năng đó lỗi lúc gọi. Xem đầy đủ ở `.env.example` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY` | không (cần key của provider nào đang chọn ở trên) | API key theo provider, dùng chung cho mọi tính năng chọn provider đó |

### Cài đặt

```bash
npm install
docker compose up -d   # chạy Postgres local khớp với .env.example
npx prisma generate
npx prisma migrate deploy
npm run db:seed        # seed role/permission RBAC
```

### Chạy

```bash
npm run start:dev    # watch mode
npm run start:prod   # production (chạy `npm run build` trước)
```

Sau khi chạy, Swagger docs ở `http://localhost:8080/api/v1/docs`.

### Deploy

Production chạy dưới dạng Docker container trên 1 **AWS EC2**
instance chạy liên tục — cùng entry point `src/main.ts` như dev local,
chỉ khác là build qua `Dockerfile` và deploy bởi
`.github/workflows/deploy.yml`. Xem [`DEPLOY.md`](DEPLOY.md) để biết
setup đầy đủ, và repo riêng `recruitment-platform-infra` cho phần
Terraform tạo instance, ECR repo, S3 uploads bucket, và SSM Parameter
Store entries.

Cron job (`close-expired-jobs.cron.ts`, `job-alert-digest.cron.ts`)
và rate limiting đều dựa vào việc chạy 1 process liên tục duy nhất —
không cần điều phối bên ngoài (DynamoDB, EventBridge) như khi deploy
qua Lambda.

### Testing

```bash
npm test        # unit test (domain entity + command/query handler) — hiện tại 460 test / 105 suite
npm run test:e2e  # e2e: register → verify → login → tạo company/job → upload+publish CV → apply; luồng chat
```

Bộ e2e chạy trên `DATABASE_URL` đang cấu hình, mail provider được override bằng stub nên không gửi mail thật.

## Tổng quan API

Toàn bộ route có prefix `/api/v1`. Resource root:

`auth`, `users`, `admin/users`, `admin/roles`, `admin/permissions`, `companies`, `categories`, `skills`, `jobs` (bao gồm `jobs/:jobId/matching-candidates`, `jobs/:jobId/candidates/:candidateId/screening-questions`, `jobs/skill-suggestions`, `jobs/draft` — module `ai`), `cvs`, `job-applications`, `bookmarks`, `notifications`, `saved-searches`, `files`, `conversations`, `messages`, `interviews`

Shape đầy đủ của request/response xem Swagger tại `/api/v1/docs`, hoặc [API_GUIDE.md](API_GUIDE.md) cho phần diễn giải chi tiết theo resource. Chat còn có 1 WebSocket namespace (`/ws`) — xem [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md) cho danh sách event.

## License

MIT
