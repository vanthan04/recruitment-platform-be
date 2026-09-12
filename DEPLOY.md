# Deploy lên AWS (1 EC2 instance duy nhất)

Đây là **bộ khung** — `scripts/deploy-remote.sh` và
`.github/workflows/deploy.yml` đã sẵn sàng chạy ngay khi các tài nguyên
AWS bên dưới tồn tại và các placeholder đã được điền. Không có gì ở đây
tự tạo tài nguyên AWS cả; việc đó thuộc về repo riêng
[`recruitment-platform-infra`](../recruitment-platform-infra) (Terraform).

## Vì sao chọn 1 EC2 thay vì Lambda hay ECS

Module chat dùng Socket.IO thật (kết nối WebSocket sống lâu dài).
Lambda + API Gateway HTTP API không giữ được kết nối đó — mỗi lần
invoke chỉ sống trong đúng thời gian xử lý 1 request. Một instance
chạy liên tục giữ WebSocket hoạt động mà không cần đổi gì trong code.
ECS Fargate cũng làm được, nhưng thường phải đi kèm Application Load
Balancer, tốn thêm phí cố định ~$16-18/tháng dù traffic thấp — không
đáng ở quy mô này. 1 instance EC2 `t3.micro` chạy trực tiếp image
Docker rẻ hơn nhiều và đơn giản hơn để suy luận bằng tay.

Entry point Lambda cũ (`src/lambda.ts`) và các cron handler nhắm tới
EventBridge (`src/handlers/`) đã bị xoá — xem `CODEBASE_SUMMARY.md`
mục 4a để biết lịch sử của lần migrate đó. Cron job giờ chạy in-process
qua `@nestjs/schedule`
(`src/modules/job/application/jobs/close-expired-jobs.cron.ts`,
`src/modules/job-alert/application/jobs/job-alert-digest.cron.ts`), và
rate limiting dùng storage in-memory mặc định của `@nestjs/throttler`
— cả hai đều dựa vào việc đây là 1 process sống liên tục, mà 1 instance
EC2 duy nhất đáp ứng đúng điều đó.

## 1. Tài nguyên AWS (do `recruitment-platform-infra` cấp phát, không phải ở đây)

Repo đó dùng Terraform để tạo EC2 instance, Elastic IP, security
group, IAM instance role, ECR repository, S3 upload bucket, và các
entry SSM Parameter Store. Xem `README.md` của repo đó để biết bước
bootstrap 1 lần và cách chạy workflow `infra.yml`. Sau khi apply xong,
ghi lại output — bạn sẽ cần EC2 instance ID và tên ECR repository ở
bước dưới.

## 2. Các entry SSM Parameter Store

Terraform của repo infra tạo 1 SecureString parameter cho mỗi biến môi
trường nhạy cảm, dưới path `/recruitment-platform/prod/`. Danh sách dưới
đây được đối chiếu trực tiếp với `env.validation.ts` — coi đó là nguồn
chân lý nếu sau này 2 bên lệch nhau nữa.

**Bắt buộc luôn** (thiếu là container throw lỗi validate và không boot
được — không có default):

`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRATION`, `JWT_REFRESH_SECRET`,
`JWT_REFRESH_EXPIRATION`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`,
`MAIL_PASS`, `MAIL_FROM`.

`JWT_EXPIRATION` và `JWT_REFRESH_EXPIRATION` đặc biệt dễ bị bỏ sót vì
không có default — đừng quên khi cấp phát.

**Có default nhưng nên set tường minh ở prod**:

- `PORT`, `API_PREFIX` — default `8080` / `api/v1`, thường không cần đổi.
- `FRONTEND_URL` — default `http://localhost:3000`. **Bắt buộc phải set
  đúng domain frontend production**, nếu không link callback OAuth
  (Google/Facebook) sẽ redirect người dùng về localhost.
- `LOG_LEVEL` — nếu bỏ trống, code tự chọn `info` khi
  `NODE_ENV=production` (xem `logger.config.ts`), nên có thể không cần
  set. Nếu set tường minh thì set `info`, không phải `debug` — set
  `debug` ở đây sẽ ghi log rất nhiều chi tiết request/query không cần
  thiết ở production.
- `CORS_ORIGIN` — danh sách origin được phép, cách nhau dấu phẩy (vd.
  domain production của frontend). `env.validation.ts` cho phép bỏ
  trống, nhưng bỏ trống sẽ khiến cả CORS policy của HTTP
  (`bootstrap.ts`) lẫn CORS policy của Socket.IO
  (`socket-io.adapter.ts`) chấp nhận *mọi* origin trong khi vẫn cho phép
  credentials — ổn cho dev local nhưng không nên để mặc định như vậy ở
  production.

**Optional, chỉ cần nếu tính năng tương ứng bật ở prod**:

- Social login: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `GOOGLE_CALLBACK_URL`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`,
  `FACEBOOK_CALLBACK_URL`. Thiếu thì app vẫn boot bình thường, chỉ có
  route `/auth/google` và `/auth/facebook` không hoạt động.
- `CV_MAX_FILE_SIZE` — default 10MB, chỉ set nếu muốn đổi giới hạn.

**File-upload storage** — chọn 1 trong 2 bộ theo `STORAGE_PROVIDER`:

- `STORAGE_PROVIDER=s3` (mặc định nếu bỏ trống) — dùng
  `S3StorageProvider`, cần: `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`,
  `S3_SECRET_KEY` (bắt buộc), và tuỳ chọn `S3_ENDPOINT` /
  `S3_FORCE_PATH_STYLE` (khi trỏ vào 1 endpoint S3-compatible như
  Cloudflare R2 thay vì AWS S3 thật) / `S3_PUBLIC_URL_BASE` (chỉ cần
  nếu dùng thêm endpoint `/files/upload` công khai với R2).
- `STORAGE_PROVIDER=supabase` — dùng `SupabaseStorageProvider`, cần:
  `SUPABASE_PROJECT_REF`, `SUPABASE_S3_REGION`,
  `SUPABASE_S3_ACCESS_KEY`, `SUPABASE_S3_SECRET_KEY`,
  `SUPABASE_STORAGE_BUCKET` (bắt buộc), và tuỳ chọn
  `SUPABASE_PUBLIC_URL_BASE`.

Đặt `STORAGE_PROVIDER` (và đúng bộ biến đi kèm) khớp với backend bạn
thực sự dùng ở prod — thiếu bộ biến bắt buộc tương ứng cũng khiến
container không boot được, y hệt lỗi thiếu `JWT_EXPIRATION`.

`scripts/deploy-remote.sh` đọc mọi parameter dưới path đó tại thời
điểm deploy và truyền từng cái thành 1 flag `-e KEY=VALUE` cho
`docker run` — nên thêm 1 biến môi trường mới chỉ là thêm 1 parameter
mới dưới cùng path, không cần sửa workflow. Bản thân path chỉ set 1
lần, trong `SSM_PARAM_PATH` của `deploy.yml`.

## 3. GitHub Secrets & Variables (chỉ dùng cho deploy workflow)

Các mục này **tách biệt** với entry SSM Parameter Store ở trên —
GitHub Secrets chỉ giúp `deploy.yml` xác thực với AWS và biết *deploy
vào đâu*. Chúng không bao giờ được container đang chạy đọc; container
chỉ đọc từ SSM Parameter Store (mục 2). Đừng đặt cùng 1 giá trị ở cả
hai chỗ rồi kỳ vọng chúng làm cùng 1 việc.

**Secrets** (Settings của repo → Secrets and variables → Actions → Secrets):
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` — thông
  tin đăng nhập cho 1 IAM user **quyền hạn hẹp**: `ecr:*` trên đúng ECR
  repo của repo này và `ssm:SendCommand`/`ssm:GetCommandInvocation`
  trên đúng 1 EC2 instance này. Cố tình không dùng chung credential
  rộng hơn mà repo infra dùng để cấp phát tài nguyên — nguyên tắc
  least privilege, key deploy bị lộ cũng không thể sửa hạ tầng. Nên
  chuyển sang OIDC (`role-to-assume` trong
  `aws-actions/configure-aws-credentials`) khi đã quen với setup này —
  không cần lưu key dài hạn ở đâu cả.

**Variables** (cùng trang, tab Variables):
- `ECR_REPOSITORY` — tên repo, lấy từ output Terraform của repo infra.
- `EC2_INSTANCE_ID` — instance ID, lấy từ output Terraform của repo infra.

## 4. Chạy 1 lần deploy

Tab Actions → workflow **Deploy** → **Run workflow**. Workflow chỉ
chạy bằng `workflow_dispatch` (không tự chạy khi push) cho tới khi bạn
hoàn tất setup ở trên. Bên dưới: build Docker image, push lên ECR, sau
đó dùng **SSM Run Command** (không phải SSH — không mở port 22, không
lưu SSH key nào cho CI) để yêu cầu instance đang chạy pull image mới,
đọc lại biến môi trường hiện tại từ SSM Parameter Store, và restart
container.

Trước khi khởi động container mới, `deploy-remote.sh` chạy `npx prisma
migrate deploy` rồi `npm run db:seed` của chính image đó (qua `docker
run --rm --entrypoint ...`) để đảm bảo schema DB và bảng
`permissions`/`role_permissions` luôn khớp với code đang deploy —
thiếu seed thì `PermissionGuard` chặn mọi route có gắn
`@RequirePermissions` (kể cả `GET /users/me`) mà không có lỗi boot nào
báo hiệu; thiếu migration thì container mới chạy nhưng crash ở query
đầu tiên đụng cột/bảng chưa tồn tại. `prisma migrate deploy` chỉ áp
dụng các migration đã commit sẵn (không tự sinh migration mới) và là
no-op nếu DB đã cập nhật, nên chạy lại mỗi lần deploy là an toàn —
giống hệt lý do `seed.ts` dùng toàn `upsert`.

`deploy-remote.sh` không tin tưởng mù quáng rằng `docker run -d` trả
về thành công nghĩa là app đã lên đúng — nó poll `/api/v1/healthcheck`
trên instance tối đa 60s sau khi khởi động container mới. Nếu seed
thất bại, hoặc image mới không "healthy" trong khoảng đó (env var sai,
crash lúc boot, hoặc migration DB chưa được apply trước), script tự
động khởi động lại
image cũ *đã* pass đúng health check này, rồi báo fail job GitHub
Actions — nhờ vậy 1 lần deploy hỏng sẽ tự phục hồi về image tốt gần
nhất thay vì để instance chết cho tới khi có người phát hiện và deploy
lại bằng tay. Marker "image tốt gần nhất" nằm ở
`/opt/recruitment-platform-be/last-good-image` ngay trên instance; với
1 instance hoàn toàn mới chưa deploy gì, không có gì để rollback về,
nên lần deploy đầu tiên thất bại sẽ chỉ báo fail (không có gì để khôi phục).

## Việc cần làm sau (không phải điểm chặn)

`S3StorageProvider` đang dùng credential `S3_ACCESS_KEY`/`S3_SECRET_KEY`
tường minh thay vì dựa vào quyền IAM của instance role để truy cập S3.
Cấu hình hiện tại vẫn chạy tốt, nhưng có thể dọn lại sau: bỏ key tường
minh khỏi S3 client và dựa vào instance role — bớt 1 secret phải quản lý.
