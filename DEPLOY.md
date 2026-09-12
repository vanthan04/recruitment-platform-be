# Deploy lên Railway

Backend deploy lên [Railway](https://railway.com) như 1 service chạy
container dài hạn (build từ `Dockerfile` ở root repo này), không phải
serverless/per-request. `railway.json` khai báo builder + healthcheck;
Railway tự build lại và deploy mỗi khi có commit mới trên `main` (GitHub
integration — xem mục 3).

## Vì sao 1 container dài hạn, không phải serverless

Module chat dùng Socket.IO thật (kết nối WebSocket sống lâu dài) — một
nền tảng chạy theo từng request (mỗi lần invoke chỉ sống trong đúng thời
gian xử lý 1 request) không giữ được kết nối đó. Cron job cũng chạy
in-process qua `@nestjs/schedule`
(`src/modules/job/application/jobs/close-expired-jobs.cron.ts`,
`src/modules/job-alert/application/jobs/job-alert-digest.cron.ts`), dựa
vào việc đây là 1 process sống liên tục — một service Railway thông
thường (không phải Function) đáp ứng đúng điều đó.

(Repo này trước đây nhắm tới AWS EC2 — `.github/workflows/deploy.yml` và
`scripts/deploy-remote.sh` của flow đó đã bị xoá khi chuyển sang Railway.
Lịch sử migrate từ Lambda sang container dài hạn trước đó nữa: xem
`CODEBASE_SUMMARY.md` mục 4a.)

## 1. Migration DB + seed RBAC — chạy tự động lúc container start

`Dockerfile`'s `CMD` chạy theo thứ tự mỗi khi container khởi động (kể cả
restart thường, không chỉ deploy mới):

```
npx prisma migrate deploy && npm run db:seed && node dist/src/main
```

- `prisma migrate deploy` chỉ áp dụng các migration đã commit sẵn (không
  tự sinh migration mới) và là no-op nếu DB đã cập nhật — an toàn để
  chạy lại mỗi lần start.
- `npm run db:seed` upsert bảng `roles`/`permissions`/`role_permissions`
  — thiếu bước này thì `PermissionGuard` chặn mọi route có gắn
  `@RequirePermissions` (kể cả `GET /users/me`) mà không có lỗi boot nào
  báo hiệu.
- Nếu 1 trong 2 lệnh trên fail, container thoát với mã lỗi khác 0 và
  `node dist/src/main` không bao giờ chạy — Railway's healthcheck
  (`railway.json`) sẽ thấy deploy mới không "healthy" và **giữ nguyên
  deployment cũ đang chạy tốt** thay vì cutover sang bản hỏng.

Cả `prisma`, `ts-node`, `typescript` (đều là devDependencies) được cài
thêm riêng vào production image cho đúng mục đích này — xem comment
trong `Dockerfile`'s `prod-deps` stage.

## 2. Biến môi trường (set trong Railway dashboard hoặc `railway variables set`)

Danh sách dưới đây đối chiếu trực tiếp với `env.validation.ts` — coi đó
là nguồn chân lý nếu sau này 2 bên lệch nhau.

**Bắt buộc luôn** (thiếu là container throw lỗi validate và không boot
được — không có default):

`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRATION`, `JWT_REFRESH_SECRET`,
`JWT_REFRESH_EXPIRATION`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`,
`MAIL_PASS`, `MAIL_FROM`, `REDIS_URL`, `NODE_ENV=production`,
`CORS_ORIGIN` (bắt buộc riêng khi `NODE_ENV=production`).

`JWT_EXPIRATION` và `JWT_REFRESH_EXPIRATION` đặc biệt dễ bị bỏ sót vì
không có default — đừng quên khi cấp phát.

Nếu `DATABASE_URL` trỏ vào 1 connection pooled (Neon `-pooler` host,
hoặc bất kỳ DB nào có PgBouncer phía trước), set thêm `DIRECT_URL` trỏ
vào connection direct/unpooled của cùng DB đó — `prisma migrate deploy`
cần session-level advisory lock mà transaction-mode pooling không cung
cấp được (xem `prisma.config.ts`). Không set thì migrate có thể lỗi dù
`DATABASE_URL` vẫn đúng cho phần còn lại của app.

**Có default nhưng nên set tường minh ở prod**:

- `PORT` — Railway tự inject `PORT` cho service, không cần set tay
  (code đọc `process.env.PORT`, default `8080` chỉ dùng khi chạy local).
- `FRONTEND_URL` — default `http://localhost:3000`. **Bắt buộc phải set
  đúng domain frontend production**, nếu không link callback OAuth
  (Google/Facebook) sẽ redirect người dùng về localhost.
- `LOG_LEVEL` — nếu bỏ trống, code tự chọn `info` khi
  `NODE_ENV=production` (xem `logger.config.ts`), nên có thể không cần
  set. Nếu set tường minh thì set `info`, không phải `debug`.
- `CORS_ORIGIN` — danh sách origin được phép, cách nhau dấu phẩy (vd.
  domain production của frontend). Bắt buộc khi `NODE_ENV=production` —
  container từ chối boot nếu thiếu, thay vì âm thầm chấp nhận mọi origin
  trong khi vẫn cho phép credentials.

**Optional, chỉ cần nếu tính năng tương ứng bật ở prod**:

- Social login: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `GOOGLE_CALLBACK_URL`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`,
  `FACEBOOK_CALLBACK_URL`. Thiếu thì app vẫn boot bình thường, chỉ có
  route `/auth/google` và `/auth/facebook` không hoạt động.
- AI features (`src/modules/ai`): `<CAPABILITY>_AI_PROVIDER`/
  `<CAPABILITY>_AI_MODEL` cho mỗi tính năng (mặc định `google`/
  `gemini-3-pro`), cộng `GOOGLE_API_KEY`/`ANTHROPIC_API_KEY`/
  `OPENAI_API_KEY` tương ứng. Thiếu key thì app vẫn boot, chỉ endpoint
  AI đó trả `503` khi gọi.
- `CV_MAX_FILE_SIZE` — default 10MB, chỉ set nếu muốn đổi giới hạn.
- `GLOBAL_THROTTLE_LIMIT`/`AUTH_THROTTLE_LIMIT` — **không set ở prod**
  (default 60 và 5 là giá trị bảo mật thật). Chỉ tồn tại để CI e2e
  nâng ngưỡng — xem comment trong `app.module.ts`/`auth.controller.ts`.

**File-upload storage** — chọn 1 trong 2 bộ theo `STORAGE_PROVIDER`:

- `STORAGE_PROVIDER=s3` (mặc định nếu bỏ trống) — dùng
  `S3StorageProvider`, cần: `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`,
  `S3_SECRET_KEY` (bắt buộc), và tuỳ chọn `S3_ENDPOINT` /
  `S3_FORCE_PATH_STYLE` (khi trỏ vào 1 endpoint S3-compatible như
  Cloudflare R2 thay vì AWS S3 thật) / `S3_PUBLIC_URL_BASE` (chỉ cần
  nếu dùng thêm endpoint `/files/upload` công khai với R2). Railway
  không có khái niệm "instance IAM role" như EC2 — credential tường
  minh (`S3_ACCESS_KEY`/`S3_SECRET_KEY`) là cách duy nhất, không phải
  việc cần dọn sau.
- `STORAGE_PROVIDER=supabase` — dùng `SupabaseStorageProvider`, cần:
  `SUPABASE_PROJECT_REF`, `SUPABASE_S3_REGION`,
  `SUPABASE_S3_ACCESS_KEY`, `SUPABASE_S3_SECRET_KEY`,
  `SUPABASE_STORAGE_BUCKET` (bắt buộc), và tuỳ chọn
  `SUPABASE_PUBLIC_URL_BASE`.

Đặt `STORAGE_PROVIDER` (và đúng bộ biến đi kèm) khớp với backend bạn
thực sự dùng ở prod — thiếu bộ biến bắt buộc tương ứng cũng khiến
container không boot được, y hệt lỗi thiếu `JWT_EXPIRATION`.

## 3. Build & deploy tự động

Railway's GitHub integration theo dõi repo này: mỗi push/merge vào
`main` tự động trigger build (Docker, từ `Dockerfile` — không cần
Nixpacks) rồi deploy, không qua GitHub Actions. `ci.yml` (build/lint/
test/audit) vẫn chạy độc lập trên mỗi push/PR như một quality gate,
nhưng **không** trigger hay chặn deploy — 2 việc tách biệt.

`railway.json` khai báo:

- `build.builder: DOCKERFILE` — build từ `Dockerfile`, không auto-detect.
- `deploy.healthcheckPath: /api/v1/healthcheck` — Railway đợi endpoint
  này trả 200 trước khi cutover traffic sang deployment mới; hết
  `healthcheckTimeout` (100s) mà chưa healthy thì deployment mới bị coi
  là fail, traffic vẫn ở deployment cũ.
- `deploy.restartPolicyType: ON_FAILURE` (tối đa 3 lần retry) — nếu
  container crash (kể cả do migrate/seed fail ở mục 1), Railway tự
  restart trước khi coi là fail hẳn.

Không set `startCommand` trong `railway.json` — cố tình để trống, dùng
`CMD` của `Dockerfile` làm nguồn chân lý duy nhất cho lệnh khởi động,
tránh 2 chỗ có thể lệch nhau.

## 4. Deploy thủ công (khi cần)

Cài Railway CLI (`npm i -g @railway/cli`), `railway login`, `railway
link` vào đúng project, rồi `railway up` để build + deploy trực tiếp từ
máy — bỏ qua bước chờ GitHub integration, hữu ích khi debug 1 thay đổi
chưa muốn commit. Xem log real-time bằng `railway logs`.

## Việc cần làm sau (không phải điểm chặn)

Chưa có Redis/Postgres riêng do Railway quản lý — `DATABASE_URL` đang
trỏ Neon, `REDIS_URL` cần trỏ 1 instance Upstash (hoặc Railway's Redis
plugin, nếu muốn mọi thứ nằm chung 1 project Railway để đơn giản hoá
việc quản lý biến môi trường/network).
