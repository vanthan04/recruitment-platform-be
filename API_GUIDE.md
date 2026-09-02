# API Guide cho Frontend

Tài liệu này mô tả cách gọi API backend Recruitment Platform: base URL, format response chuẩn, luồng auth, và chi tiết từng endpoint theo resource. Swagger UI (`/api/v1/docs`) cho schema tự động sinh; tài liệu này bổ sung phần Swagger không thể hiện rõ: role nào được gọi endpoint nào, response thật sự trả về gì, và vài điểm bất nhất cần lưu ý khi tích hợp.

> Xem thêm: [README.md](README.md) (tổng quan dự án), [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md) (kiến trúc), [API_TYPES.md](API_TYPES.md) (type TypeScript đầy đủ cho response của từng endpoint — copy thẳng vào FE).

---

## 1. Base URL & Response format

### ⚠️ Backend là 1 monolith duy nhất — không phải microservices

Toàn bộ resource (`auth`, `users`, `companies`, `categories`, `jobs`, và tất cả module khác) đang chạy trong **cùng 1 process NestJS, cùng 1 origin, cùng 1 port**. Không có service nào tách riêng, không có API gateway đứng trước nhiều backend khác nhau.

Nếu FE đang cấu hình theo kiểu 1 base URL riêng cho từng domain (chuẩn bị sẵn cho microservices sau này), ví dụ:

```ts
export const SERVICE_BASE_URL: Record<ServiceName, string> = {
  auth: process.env.AUTH_SERVICE_URL ?? DEFAULT_ORIGIN,
  users: process.env.USERS_SERVICE_URL ?? DEFAULT_ORIGIN,
  companies: process.env.COMPANIES_SERVICE_URL ?? DEFAULT_ORIGIN,
  // ...
};
```

thì về mặt kỹ thuật **không sai** (mọi entry đều fallback về cùng `DEFAULT_ORIGIN` nên vẫn chạy đúng), nhưng cần lưu ý:

1. **Đừng set các env `*_SERVICE_URL` riêng lẻ trỏ sang origin khác nhau** — hiện tại chưa có service nào deploy tách riêng, set khác nhau sẽ gọi nhầm chỗ và lỗi CORS/404.
2. **Danh sách `ServiceName` đang thiếu domain** so với API thật — resource root hiện có đầy đủ là:

   `auth`, `users`, `admin/users`, `companies`, `categories`, `jobs`, `cvs`, `job-applications`, `bookmarks`, `notifications`, `saved-searches`, `files`

   Nếu muốn giữ pattern theo-domain, nên bổ sung đủ các key còn thiếu (`cvs`, `job-applications`, `bookmarks`, `notifications`, `saved-searches`, `files`) — tất cả đều fallback về `DEFAULT_ORIGIN` giống nhau.
3. Đơn giản nhất cho giai đoạn hiện tại: chỉ cần **1 biến `BACKEND_URL`** + 1 hằng `API_PREFIX`, build URL kiểu `` `${BACKEND_URL}${API_PREFIX}/<resource>` ``. Không cần trừu tượng hoá theo service khi backend chưa thực sự tách. Khi nào backend tách microservices thật, sẽ có thông báo cụ thể domain nào chuyển sang origin nào.

- Base URL: `http://localhost:8080/api/v1` (dev). Prefix `/api/v1` áp dụng cho mọi route.
- Mọi response (kể cả lỗi) đều có cùng "envelope":

```json
{
  "success": true,
  "message": "Job created successfully",
  "code": "SUCCESS",
  "data": { "...": "..." },
  "metadata": { "total": 42, "page": 1, "limit": 10 },
  "timestamp": "2026-09-02T04:26:07.504Z"
}
```

- `data` có thể là object, array, hoặc `null` (với các action chỉ trả message, ví dụ đổi mật khẩu).
- `metadata` chỉ xuất hiện ở các endpoint có phân trang (xem mục 3). Nếu không phân trang thì field này vắng mặt (`undefined`), không phải `null`.
- **Ngoại lệ duy nhất**: `GET /cvs/:id/export` trả về **binary PDF thật** (`Content-Type: application/pdf`), không bọc trong envelope JSON ở trên.
- Các response `204 No Content` (xoá) không có body.

### Lỗi

```json
{
  "success": false,
  "message": "Job with id \"...\" not found",
  "code": "ENTITY_NOT_FOUND",
  "timestamp": "2026-09-02T04:26:07.504Z"
}
```

| HTTP status | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body/query sai validation (`class-validator`) — `message` là chuỗi các lỗi nối bằng dấu phẩy |
| 400 | `BUSINESS_RULE_VIOLATION` | Vi phạm business rule (vd. publish CV khi chưa có kinh nghiệm, apply job đã đóng) |
| 401 | `HTTP_ERROR` | Chưa đăng nhập / token sai hoặc hết hạn / sai mật khẩu |
| 403 | `UNAUTHORIZED_ACTION` hoặc `HTTP_ERROR` | Không phải chủ sở hữu resource, hoặc sai role (`RolesGuard`) |
| 404 | `ENTITY_NOT_FOUND` hoặc `HTTP_ERROR` | Không tìm thấy resource |
| 409 | `DUPLICATE_ENTITY` hoặc `HTTP_ERROR` | Trùng dữ liệu (email đã tồn tại, đã apply job này rồi...) |
| 413 | `HTTP_ERROR` | File upload vượt giới hạn kích thước |
| 429 | `HTTP_ERROR` | Vượt rate-limit (xem mục 2) |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi hệ thống không lường trước |

Lưu ý: nhiều exception ném trực tiếp từ NestJS (`UnauthorizedException`, `NotFoundException`, `ConflictException`...) đều có `code: "HTTP_ERROR"` — muốn phân biệt loại lỗi chính xác, FE nên dựa vào **HTTP status**, không chỉ dựa vào `code`.

---

## 2. Authentication

JWT Bearer token. Header: `Authorization: Bearer <access_token>`.

### Luồng đăng ký

```
POST /auth/register  { email, password, fullName, role: "CANDIDATE"|"RECRUITER"|"ADMIN" }
  → gửi email chứa mã xác thực (6 ký tự)
POST /auth/verify     { code }
  → set status ACTIVE
POST /auth/login      { email, password }
  → { access_token, refresh_token }
```

⚠️ **Lưu ý quan trọng**: `POST /auth/login` **không kiểm tra `status`** — user chưa verify email vẫn đăng nhập được bình thường. Verify chỉ chuyển status sang `ACTIVE`, không phải điều kiện bắt buộc để login (đây là hành vi hiện tại của backend, không phải điều FE cần tự xử lý).

### Access token vs refresh token

- `access_token`: hết hạn sau **15 phút**, dùng cho mọi request cần auth.
- `refresh_token`: hết hạn sau **7 ngày**, dùng để lấy cặp token mới.
- **Đa thiết bị**: mỗi lần login tạo 1 phiên độc lập (có thể đăng nhập cùng lúc trên nhiều thiết bị, mỗi thiết bị có refresh token riêng).
- **Refresh token rotation**: mỗi lần gọi `/auth/refresh`, refresh token cũ bị thu hồi ngay và trả về refresh token MỚI — FE **phải lưu đè** `refresh_token` mới sau mỗi lần refresh, dùng lại token cũ sẽ bị từ chối (403).

```
POST /auth/refresh    { refreshToken }        → { access_token, refresh_token }   (token mới!)
POST /auth/logout     { refreshToken }         → chỉ đăng xuất thiết bị hiện tại (cần Bearer token)
POST /auth/logout-all                          → đăng xuất TẤT CẢ thiết bị (cần Bearer token, không cần body)
```

### Quên/đổi mật khẩu

```
POST /auth/forgot-password  { email }               → gửi mail mã reset (6 ký tự)
POST /auth/reset-password   { code, newPassword }
POST /auth/change-password  { oldPassword, newPassword }   (cần Bearer token)
```

### Rate limit

Toàn bộ API giới hạn **60 request/60s theo IP**. Riêng `POST /auth/register`, `/auth/login`, `/auth/forgot-password` giới hạn chặt hơn: **5 request/60s**. Vượt quá → `429`.

### Roles

`CANDIDATE` | `RECRUITER` | `ADMIN`. Một số endpoint yêu cầu role cụ thể — xem cột **Auth** ở từng bảng bên dưới.

---

## 3. Phân trang

Các endpoint có phân trang nhận query `page` (mặc định 1), `limit` (mặc định 10, tối đa 50), trả `metadata` cùng một shape thống nhất: `{ total, page, limit }`.

Áp dụng cho: `GET /jobs`, `GET /companies`, `GET /notifications`, `GET /admin/users`.

`GET /categories`, `GET /saved-searches`, `GET /cvs`, `GET /bookmarks`, `GET /job-applications/my-applications`, `GET /job-applications/job/:jobId` **không phân trang** — trả toàn bộ mảng.

---

## 4. Resources

Ký hiệu cột **Auth**: 🔓 public (không cần token) · 🔒 cần Bearer token (mọi role) · `CANDIDATE`/`RECRUITER`/`ADMIN` = cần đúng role đó.

### 4.1. Users (`/users`, `/admin/users`)

| Method & Path | Auth | Body | Response `data` |
|---|---|---|---|
| `GET /users/me` | 🔒 | — | User hiện tại (trừ `password`/`verifyCode`), gồm `profile` lồng bên trong |
| `PATCH /users/profile` | 🔒 | `UpdateProfileDto` (xem dưới) | `null` — thông báo nằm ở `message` cấp envelope, **không trả profile mới**, FE tự gọi lại `GET /users/me` |
| `GET /admin/users?page&limit` | `ADMIN` | — | `User[]` (trừ `password`) |
| `PATCH /admin/users/:id` | `ADMIN` | `{ status?, role? }` | `null` — thông báo nằm ở `message` cấp envelope, không trả entity mới |

**`UpdateProfileDto`**: `fullName?`, `phoneNumber?` (định dạng SĐT Việt Nam), `gender?` (`MALE`/`FEMALE`/`OTHER`), `birthDate?` (ISO date string), `avatarUrl?` (URL — upload ảnh qua `/files/upload` trước rồi lấy URL trả về).

### 4.2. Company (`/companies`)

Recruiter phải có company mới đăng job được (1 recruiter ↔ 1 company).

| Method & Path | Auth | Body / Query | Ghi chú |
|---|---|---|---|
| `POST /companies` | `RECRUITER` | `CreateCompanyDto` | 409 nếu recruiter đã có company rồi |
| `GET /companies?keyword&industry&page&limit` | 🔓 | — | |
| `GET /companies/:id` | 🔓 | — | `data` = company + field `openJobs: Job[]` (job đang OPEN của company) |
| `PATCH /companies/:id` | `RECRUITER` | `UpdateCompanyDto` | Chỉ owner mới sửa được (403 nếu không phải) |
| `DELETE /companies/:id` | `RECRUITER` | — | Soft delete, chỉ owner, trả `204` |

**`CreateCompanyDto`**: `name` (bắt buộc), `logoUrl?`, `description?`, `website?`, `industry?`, `size?` (`SIZE_1_10`/`SIZE_11_50`/`SIZE_51_200`/`SIZE_201_500`/`SIZE_500_PLUS`), `address?`.

### 4.3. Category (`/categories`)

Danh mục ngành nghề — ADMIN quản lý, dùng cho dropdown filter job.

| Method & Path | Auth | Body |
|---|---|---|
| `POST /categories` | `ADMIN` | `{ name }` |
| `GET /categories` | 🔓 | — (trả toàn bộ, không phân trang) |
| `PATCH /categories/:id` | `ADMIN` | `{ name? }` |
| `DELETE /categories/:id` | `ADMIN` | — (`204`) |

`slug` tự sinh từ `name`, tự thêm hậu tố `-2`, `-3`... nếu trùng.

### 4.4. Job (`/jobs`)

| Method & Path | Auth | Body / Query |
|---|---|---|
| `POST /jobs` | `RECRUITER` | `CreateJobDto` — **không gửi `companyId`**, backend tự lấy company của recruiter đang đăng nhập (400 nếu recruiter chưa có company) |
| `GET /jobs?keyword&location&jobType&level&categoryId&companyId&salaryMin&salaryMax&page&limit` | 🔓 | Chỉ trả job có status `OPEN` |
| `GET /jobs/:id` | 🔓 | Mỗi lần gọi tăng `viewCount` (bất đồng bộ, có thể lệch 1 request) |
| `PATCH /jobs/:id` | `RECRUITER` | `UpdateJobDto` (chỉ owner) |
| `DELETE /jobs/:id` | `RECRUITER` | Soft delete, chỉ owner (`204`) |
| `PATCH /jobs/:id/close` | `RECRUITER` | Chỉ owner. Job cũng tự động `CLOSED` khi quá `expiresAt` (cron chạy mỗi giờ) |
| `PATCH /jobs/:id/reopen` | `RECRUITER` | Chỉ đóng được job đang `CLOSED` |

**`CreateJobDto`**: `title`, `description`, `location` (bắt buộc); `jobType?` (`FULL_TIME`/`PART_TIME`/`CONTRACT`/`INTERNSHIP`/`REMOTE`, mặc định `FULL_TIME`), `level?` (`INTERN`/`FRESHER`/`JUNIOR`/`MIDDLE`/`SENIOR`/`MANAGER`), `categoryId?`, `salaryMin?`, `salaryMax?`, `currency?` (mặc định `VND`), `requirements?`, `benefits?`, `expiresAt?` (ISO date).

**Response `Job`**: gồm cả object lồng `company: { id, name, logoUrl } | null` và `category: { id, name, slug } | null` (không cần gọi thêm API để lấy tên company/category khi hiển thị list).

### 4.5. CV (`/cvs`)

⚠️ **Toàn bộ endpoint CV — kể cả `GET`/`export` — đều yêu cầu Bearer token**, không có endpoint public nào trong module này (khác với Job/Company).

| Method & Path | Auth | Ghi chú |
|---|---|---|
| `POST /cvs` | `CANDIDATE` | `CreateCvDto` |
| `GET /cvs` | `CANDIDATE` | CV của chính mình |
| `GET /cvs/:id` | 🔒 (mọi role) | Xem CV theo id — **không check quyền sở hữu**, ai có token cũng xem được CV bất kỳ nếu biết id |
| `PATCH /cvs/:id` | `CANDIDATE` | `UpdateCvDto` — thay experiences/educations/skills là **thay toàn bộ mảng** (gửi thiếu phần tử nào sẽ mất phần tử đó) |
| `PATCH /cvs/:id/publish` | `CANDIDATE` | Yêu cầu có ít nhất 1 experience hoặc education |
| `DELETE /cvs/:id` | `CANDIDATE` | Soft delete (`204`) |
| `POST /cvs/:id/upload` | `CANDIDATE` | `multipart/form-data`, field `file` — PDF/DOC/DOCX, tối đa **10MB** |
| `GET /cvs/:id/export` | 🔒 (mọi role) | Trả **PDF nhị phân thật** (không phải JSON), xuất từ dữ liệu structured |

**`CreateCvDto`**: `title` (bắt buộc), `summary?`, `experiences?[]` (`company`, `position`, `startDate` bắt buộc; `description?`, `endDate?`, `isCurrent?`), `educations?[]` (`school`, `degree`, `startDate` bắt buộc; `fieldOfStudy?`, `description?`, `endDate?`), `skills?[]` (`name` bắt buộc; `level?`).

Response `Cv` gồm `fileUrl: string | null` (URL file upload gần nhất, nếu có).

### 4.6. Job Application (`/job-applications`)

| Method & Path | Auth | Body / Ghi chú |
|---|---|---|
| `POST /job-applications` | `CANDIDATE` | `{ jobId, cvId, coverLetter? }` — CV **phải đã publish**, job phải đang OPEN, mỗi user chỉ apply 1 lần/job (409 nếu apply lại, kể cả khi đơn cũ đã `WITHDRAWN`) |
| `GET /job-applications/my-applications` | `CANDIDATE` | Đơn của chính mình |
| `GET /job-applications/job/:jobId` | `RECRUITER` | Chỉ recruiter sở hữu job đó |
| `GET /job-applications/job/:jobId/stats` | `RECRUITER` | `data`: `{ jobId, viewCount, totalApplications, pending, accepted, rejected, withdrawn }` |
| `PATCH /job-applications/:id/withdraw` | `CANDIDATE` | Chỉ chủ đơn, chỉ khi đang `PENDING` |
| `PATCH /job-applications/:id/status` | `RECRUITER` | `{ status: "ACCEPTED"\|"REJECTED" }` — chỉ recruiter sở hữu job, chỉ áp dụng khi đơn đang `PENDING` |

`ApplicationStatus`: `PENDING` → `ACCEPTED` / `REJECTED` / `WITHDRAWN` (trạng thái cuối, không đổi tiếp được).

Trả về job apply → phát event thông báo cho recruiter; đổi status → phát event thông báo cho candidate (xem mục Notification).

### 4.7. Bookmark (`/bookmarks`)

| Method & Path | Auth | Ghi chú |
|---|---|---|
| `POST /bookmarks/toggle/:jobId` | `CANDIDATE` | Toggle: chưa lưu → lưu, đã lưu → bỏ lưu. `data`: `{ bookmarked: boolean }` |
| `GET /bookmarks` | `CANDIDATE` | `data`: `Bookmark[]` — **không kèm thông tin job** (field `job` luôn rỗng dù DTO khai báo), FE cần tự gọi `GET /jobs/:jobId` để lấy chi tiết |

### 4.8. Notification (`/notifications`)

Không cần role cụ thể, chỉ cần đăng nhập.

| Method & Path | Query |
|---|---|
| `GET /notifications?page&limit` | `metadata: { total, page, limit }` |
| `PATCH /notifications/:id/read` | Đánh dấu đã đọc 1 thông báo (400 nếu đã đọc rồi) |
| `PATCH /notifications/read-all` | Đánh dấu tất cả đã đọc |

`type`: `NEW_APPLICATION` (gửi cho recruiter khi có ứng viên apply) | `APPLICATION_STATUS_CHANGED` (gửi cho candidate khi đơn được duyệt/từ chối). `metadata` (field riêng trong từng notification, khác `metadata` phân trang) chứa `{ applicationId, jobId, status? }`.

### 4.9. Job Alert / Saved Search (`/saved-searches`)

Lưu điều kiện tìm việc để nhận mail digest khi có job mới phù hợp (cron chạy 7h sáng mỗi ngày).

| Method & Path | Auth | Body |
|---|---|---|
| `POST /saved-searches` | `CANDIDATE` | `{ keyword?, location?, categoryId?, jobType? }` |
| `GET /saved-searches` | `CANDIDATE` | Của chính mình |
| `DELETE /saved-searches/:id` | `CANDIDATE` | Chỉ chủ sở hữu (`204`) |

### 4.10. File Upload (`/files`)

| Method & Path | Auth | Ghi chú |
|---|---|---|
| `POST /files/upload` | 🔒 | `multipart/form-data`: field `file` (ảnh: jpeg/png/webp/gif, tối đa **5MB**), field `folder?` (string, mặc định `general`, vd `avatars`) → `data`: `{ url }` |

Dùng endpoint này để lấy `avatarUrl` trước khi gọi `PATCH /users/profile`, hoặc `logoUrl` trước khi tạo/sửa company.

### 4.11. Chat (`/conversations`, `/messages`) + WebSocket

Conversation luôn gắn với 1 `JobApplication` đã `ACCEPTED` — recruiter là người khởi tạo.

| Method & Path | Auth | Ghi chú |
|---|---|---|
| `POST /conversations` | `RECRUITER` | `{ applicationId }` — application phải `ACCEPTED`, recruiter phải là chủ job. Idempotent (gọi lại nhiều lần trả về cùng 1 conversation) |
| `GET /conversations?page&limit` | 🔒 | Hội thoại của chính mình, sắp theo `lastMessageAt` desc. Mỗi item kèm `otherParticipant`, `lastMessage`, `unreadCount`, `jobTitle`, `applicationStatus` |
| `GET /conversations/:id` | 🔒 | Chỉ thành viên (403 nếu không phải) |
| `GET /conversations/:id/messages?cursor&limit` | 🔒 | **Cursor-based** (khác mọi list khác trong hệ thống) — không truyền `cursor` để lấy trang mới nhất, `metadata.nextCursor` dùng cho lần gọi tiếp theo (tin cũ hơn) |
| `POST /conversations/:id/messages` | 🔒 | `{ content, messageType?, clientMessageId, attachments? }` — `clientMessageId` (UUID, do client tự sinh) là khoá idempotency, gửi lại cùng giá trị sẽ không tạo tin nhắn trùng |
| `PATCH /messages/:id` | 🔒 | `{ content }` — chỉ người gửi, chỉ tin `TEXT` chưa xoá |
| `DELETE /messages/:id` | 🔒 | Soft-delete, chỉ người gửi |
| `POST /conversations/:id/read` | 🔒 | Đánh dấu đã đọc đến thời điểm hiện tại |

File đính kèm: upload qua `POST /files/upload` (folder `chat-attachments`) trước, rồi gửi `{fileName, fileUrl, mimeType, fileSize}` trong mảng `attachments` của `POST .../messages` — tối đa 5 tệp/tin nhắn.

**WebSocket** (namespace `/ws`, cùng origin backend): xác thực bằng cookie `access_token` (không phải Bearer header) — client cần mở socket với `withCredentials: true` **trực tiếp tới origin backend**, không qua Next.js server. Event chính: `conversation:subscribe`/`unsubscribe`, `message:send` → `message:ack`/`message:new`/`message:error`, `message:read`, `typing:start`/`typing:stop`, `user:online`/`user:offline`. Gửi tin nhắn nên ưu tiên qua socket (`message:send`); REST `POST .../messages` chỉ là fallback khi socket mất kết nối — cả 2 đường đều phát `message:new` tới người nhận (kể cả khi họ gửi qua đường REST) nên không lo bỏ lỡ tin nhắn.

`NotificationType.NEW_MESSAGE` được tạo khi người nhận **không** đang có kết nối WebSocket nào (offline) — đang online thì chỉ nhận qua socket, không tạo notification trùng.

---

## 5. Enums tham khảo nhanh

| Enum | Giá trị |
|---|---|
| `UserRole` | `CANDIDATE`, `RECRUITER`, `ADMIN` |
| `UserStatus` | `PENDING`, `ACTIVE`, `BLOCKED` |
| `Gender` | `MALE`, `FEMALE`, `OTHER` |
| `CvStatus` | `DRAFT`, `PUBLISHED` |
| `JobStatus` | `DRAFT`, `OPEN`, `CLOSED` |
| `JobType` | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`, `REMOTE` |
| `JobLevel` | `INTERN`, `FRESHER`, `JUNIOR`, `MIDDLE`, `SENIOR`, `MANAGER` |
| `ApplicationStatus` | `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN` |
| `CompanySize` | `SIZE_1_10`, `SIZE_11_50`, `SIZE_51_200`, `SIZE_201_500`, `SIZE_500_PLUS` |
| `NotificationType` | `NEW_APPLICATION`, `APPLICATION_STATUS_CHANGED`, `NEW_MESSAGE` |
| `ConversationStatus` | `ACTIVE`, `ARCHIVED` |
| `MessageType` | `TEXT`, `IMAGE`, `FILE`, `SYSTEM` (chỉ server tạo, không nhận từ client) |
| `ChatParticipantRole` | `CANDIDATE`, `RECRUITER` |

---

## 6. Những điểm dễ gây bug tích hợp (đọc kỹ trước khi code)

1. **CV endpoints luôn cần token**, kể cả `GET /cvs/:id` và `/export` — nếu FE định làm trang xem CV public (candidate share CV cho người ngoài xem) thì **chưa làm được** với API hiện tại, cần báo lại backend.
2. **`GET /cvs/:id` không check quyền sở hữu** — bất kỳ user nào có token đều xem được CV của người khác nếu biết id. Không dựa vào endpoint này để giới hạn quyền riêng tư trên FE.
3. **Refresh token đổi mỗi lần dùng** — FE phải cập nhật lại refresh token lưu trong storage sau MỌI lần gọi `/auth/refresh`, không chỉ lưu 1 lần lúc login.
4. **`PATCH /users/profile` và `PATCH /admin/users/:id` không trả entity mới** — `data: null`, thông báo nằm ở field `message` cấp envelope (giống mọi endpoint action-only khác như `/auth/verify`, `/auth/forgot-password`...). Muốn cập nhật UI, gọi lại `GET /users/me` (hoặc `GET /admin/users`) sau khi PATCH thành công.
5. **`Bookmark`/`JobApplication` response không kèm chi tiết job/CV** dù DTO có khai báo field `job`/`cv` — luôn là `undefined`. Phải tự join dữ liệu ở FE bằng cách gọi thêm API theo `jobId`/`cvId`.
6. **Apply lại job đã rút đơn (`WITHDRAWN`) sẽ bị từ chối (409)** — hệ thống chưa cho phép apply lại cùng 1 job dù đơn cũ đã withdraw.
7. **`PATCH /cvs/:id` là full-replace cho mảng con** — không phải merge. Muốn sửa 1 experience trong nhiều cái, phải gửi lại toàn bộ mảng `experiences` (kèm `id` cho các phần tử giữ nguyên).
8. **Đăng ký không tự chặn role `ADMIN`** — `POST /auth/register` cho phép `role: "ADMIN"` như một lựa chọn công khai (không có cơ chế duyệt/whitelist). FE nên **ẩn lựa chọn ADMIN khỏi form đăng ký công khai** (chỉ cho chọn CANDIDATE/RECRUITER), việc tạo admin nên làm qua kênh khác.
9. **`GET /jobs` chỉ trả job `status = OPEN`** — job `DRAFT`/`CLOSED` không xuất hiện trong search công khai, kể cả khi filter theo `companyId` (nên trang "quản lý job của tôi" cho recruiter cần một cách khác để xem job DRAFT/CLOSED của họ — hiện backend chưa có endpoint `GET /jobs/mine`, cần dùng `findAllByRecruiter` ở tầng repository nhưng chưa expose qua controller; báo lại backend nếu FE cần).
