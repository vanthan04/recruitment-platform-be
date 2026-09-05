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

   `auth`, `users`, `admin/users`, `admin/roles`, `admin/permissions`, `companies`, `categories`, `skills`, `jobs`, `cvs`, `job-applications`, `bookmarks`, `notifications`, `saved-searches`, `files`, `conversations`, `messages`, `interviews`

   Nếu muốn giữ pattern theo-domain, nên bổ sung đủ các key còn thiếu — tất cả đều fallback về `DEFAULT_ORIGIN` giống nhau.
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
- Các response `204 No Content` (xoá) không có body.
- Không còn endpoint nào trả binary trực tiếp — `GET /cvs/:id/download` (thay cho `/export` cũ) trả JSON `{ url, expiresAt }` (presigned S3 URL), không phải file nhị phân.

### Lỗi

```json
{
  "success": false,
  "message": "Job with id \"...\" not found",
  "code": "ENTITY_NOT_FOUND",
  "metadata": { "requestId": "c3b1e2..." },
  "timestamp": "2026-09-02T04:26:07.504Z"
}
```

`metadata.requestId` chỉ xuất hiện ở response lỗi (không có ở response thành công, khác với `metadata` phân trang ở mục 3) — cùng giá trị với header response `x-request-id`. Hữu ích khi báo lỗi cho backend: gửi kèm `requestId` để tra đúng log.

| HTTP status | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body/query sai validation (`class-validator`) — `message` là chuỗi các lỗi nối bằng dấu phẩy |
| 400 | `BUSINESS_RULE_VIOLATION` | Vi phạm business rule (vd. publish CV khi chưa có kinh nghiệm, apply job đã đóng) |
| 401 | `HTTP_ERROR` | Chưa đăng nhập / token sai hoặc hết hạn / sai mật khẩu |
| 403 | `UNAUTHORIZED_ACTION` hoặc `HTTP_ERROR` | Không phải chủ sở hữu resource, hoặc role của user không có permission cần thiết (`PermissionGuard`, DB-driven qua `role_permissions`) |
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

⚠️ Phân quyền thật sự chạy bằng **RBAC database-driven** (`PermissionGuard` tra bảng `role_permissions`), không hard-code role→endpoint trong code. Cột **Auth** trong tài liệu này ghi role *hiện đang* nắm permission đó theo seed mặc định — admin có thể đổi qua `PUT /admin/roles/:id/permissions` (mục 4.13) mà không cần deploy lại, nên trên thực tế một role có thể được cấp/rút quyền gọi 1 endpoint mà không khớp bảng dưới nữa. Nếu FE cần biết chính xác quyền hiện tại của user, gọi `GET /admin/roles/:id/permissions` (cần quyền admin) thay vì hard-code theo tài liệu này.

⚠️ **Ở tầng DB, cột enum `User.role` cũ + trigger đồng bộ đã bị xoá** — `roleId`/quan hệ tới bảng `Role` giờ là nguồn sự thật duy nhất. Đây thuần tuý là dọn dẹp nội bộ: **shape API không đổi** — JWT payload, response `GET /users/me`, v.v. vẫn trả `role` là chuỗi `"CANDIDATE"|"RECRUITER"|"ADMIN"` như cũ (giờ lấy từ `roleRef.name` thay vì cột enum). FE không cần sửa gì.

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
| `GET /companies?keyword&page&limit` | 🔓 | — | |
| `GET /companies/:id` | 🔓 | — | `data` = company + field `openJobs: Job[]` (job đang OPEN của company) |
| `PATCH /companies/:id` | `RECRUITER` | `UpdateCompanyDto` | Chỉ owner mới sửa được (403 nếu không phải) |
| `DELETE /companies/:id` | `RECRUITER` | — | Soft delete, chỉ owner, trả `204` |

**`CreateCompanyDto`**: `name` (bắt buộc), `logoUrl?`, `description?`, `website?`, `size?` (`SIZE_1_10`/`SIZE_11_50`/`SIZE_51_200`/`SIZE_201_500`/`SIZE_500_PLUS`), `address?`.

⚠️ **`industry` đã bị xoá hoàn toàn** (field, query filter, migration) — nền tảng cam kết chỉ phục vụ ngành IT, không còn multi-industry. Xem [docs/industry-expansion.md](docs/industry-expansion.md) để biết bối cảnh quyết định.

⚠️ **`Company.companyType`** (`PRODUCT`/`OUTSOURCING`/`STARTUP`/`CONSULTING`) tồn tại ở tầng DB (`prisma/schema.prisma`) nhưng **chưa được expose** qua `CreateCompanyDto`/`UpdateCompanyDto`/`SearchCompanyDto` — không gửi field này lên API vì backend hiện chưa đọc/ghi nó qua HTTP.

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
| `GET /jobs?keyword&location&employmentType&workMode&level&categoryId&companyId&salaryMin&salaryMax&sort&page&limit` | 🔓 | Chỉ trả job có status `OPEN` |
| `GET /jobs/mine?page&limit` | `RECRUITER` | Job của chính recruiter (kể cả `DRAFT`/`CLOSED`) — dùng cho trang "quản lý job của tôi", khác `GET /jobs` vốn chỉ trả `OPEN` |
| `GET /jobs/:id` | 🔓 | Mỗi lần gọi tăng `viewCount` (atomic, không lệch dù nhiều request đồng thời) |
| `PATCH /jobs/:id` | `RECRUITER` | `UpdateJobDto` (chỉ owner) |
| `DELETE /jobs/:id` | `RECRUITER` | Soft delete, chỉ owner (`204`) |
| `PATCH /jobs/:id/close` | `RECRUITER` | Chỉ owner. Job cũng tự động `CLOSED` khi quá `expiresAt` (cron chạy mỗi giờ) |
| `PATCH /jobs/:id/reopen` | `RECRUITER` | Chỉ đóng được job đang `CLOSED` |

⚠️ **`jobType` đã tách thành 2 field độc lập**: `employmentType` (`FULL_TIME`/`PART_TIME`/`CONTRACT`/`INTERNSHIP`) và `workMode` (`ONSITE`/`HYBRID`/`REMOTE`) — trước đây `REMOTE` là 1 giá trị trong cùng enum `jobType`, giờ 1 job có thể vừa `FULL_TIME` vừa `REMOTE` cùng lúc (2 chiều độc lập).

**`CreateJobDto`**: `title`, `description`, `location` (bắt buộc); `employmentType?` (mặc định `FULL_TIME`), `workMode?` (mặc định `ONSITE`), `level?` (`INTERN`/`FRESHER`/`JUNIOR`/`MIDDLE`/`SENIOR`/`MANAGER`), `categoryId?`, `salaryMin?`, `salaryMax?`, `currency?` (mặc định `VND`), `requirements?`, `benefits?`, `extraInfo?` (object tự do dạng `Record<string,string>`), `expiresAt?` (ISO date), `skillIds?` (`string[]`, id các `Skill` — xem mục 4.4b).

**Response `Job`**: gồm cả object lồng `company: { id, name, logoUrl } | null`, `category: { id, name, slug } | null`, và `skills: { id, name, slug }[]` (không cần gọi thêm API để lấy tên company/category/skill khi hiển thị list).

⚠️ **`GET /jobs` chưa hỗ trợ filter theo `skillIds`** — dù `Job` đã có quan hệ nhiều-nhiều với `Skill`, query params của `GET /jobs` hiện chưa nhận `skillIds` (chỉ nhận được lúc tạo/sửa job). Cần bổ sung sau nếu FE cần search theo kỹ năng.

### 4.4b. Skill (`/skills`)

Danh mục kỹ năng (tag) gắn vào job — pattern CRUD giống hệt `Category`.

| Method & Path | Auth | Body |
|---|---|---|
| `POST /skills` | 🔒 (permission `SKILL_CREATE`) | `{ name }` |
| `GET /skills` | 🔓 | — (toàn bộ, không phân trang) |
| `PATCH /skills/:id` | 🔒 (permission `SKILL_UPDATE`) | `{ name? }` |
| `DELETE /skills/:id` | 🔒 (permission `SKILL_DELETE`) | — (`204`) |

Không có `GET /skills/:id`. `slug` tự sinh từ `name` giống `Category`. Theo mặc định RBAC seed chỉ `ADMIN` có các permission này, nhưng đây là DB-driven (xem mục 2 phần Roles) — có thể đổi mà không cần deploy lại.

### 4.5. CV (`/cvs`)

⚠️ **CV Builder (structured experiences/educations/skills, export PDF) đã bị xoá hoàn toàn.** CV giờ chỉ là **1 file duy nhất** (PDF/DOC/DOCX) do candidate tự soạn và upload — không còn form nhập kinh nghiệm/học vấn/kỹ năng, không còn xuất PDF từ dữ liệu structured. Toàn bộ endpoint vẫn yêu cầu Bearer token, không có endpoint public.

| Method & Path | Auth | Ghi chú |
|---|---|---|
| `POST /cvs` | `CANDIDATE` | `multipart/form-data` — field `file` + field text `title` |
| `GET /cvs` | `CANDIDATE` | CV của chính mình (metadata, không phải file) |
| `GET /cvs/:id` | 🔒 (mọi role, chỉ metadata) | |
| `GET /cvs/:id/download` | 🔒 | Trả `{ url, expiresAt }` — presigned S3 URL, hết hạn sau **5 phút** |
| `PATCH /cvs/:id` | `CANDIDATE` | `{ title? }` — **chỉ đổi tên**, không thay file (muốn đổi file phải tạo CV mới) |
| `PATCH /cvs/:id/publish` | `CANDIDATE` | Chuyển `DRAFT` → `PUBLISHED` |
| `DELETE /cvs/:id` | `CANDIDATE` | Soft delete (`204`) |

**`POST /cvs`** (multipart): field `file` — MIME type phải là `application/pdf`, `application/msword`, hoặc `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (kiểm tra theo MIME, không theo đuôi file); giới hạn kích thước cấu hình qua env `CV_MAX_FILE_SIZE` (mặc định **10MB**, có ceiling cứng 20MB ở tầng Multer). Field text `title` (bắt buộc, tối đa 300 ký tự).

**Response `Cv`** (`CvResponseDto`): `{ id, title, originalName, fileType (PDF/DOC/DOCX), mimeType, fileSize, status, createdAt, updatedAt, userId }` — không trả `fileKey` (khoá S3 nội bộ), muốn tải file phải gọi `GET /cvs/:id/download`.

⚠️ **Quyền tải file (`GET /cvs/:id/download`)**: chủ CV luôn tải được; recruiter tải được **chỉ khi** có `JobApplication` nộp CV đó vào 1 job do recruiter đó sở hữu — nếu không thuộc 1 trong 2 trường hợp này, trả lỗi (`CvDownloadAccessDeniedException`, 403). Khác với bản cũ, **không còn tình trạng "ai có token cũng xem được CV bất kỳ"**.

### 4.6. Job Application (`/job-applications`)

| Method & Path | Auth | Body / Ghi chú |
|---|---|---|
| `POST /job-applications` | `CANDIDATE` | `{ jobId, cvId, coverLetter? }` — CV **phải đã publish**, job phải đang OPEN, mỗi user chỉ apply 1 lần/job (409 nếu apply lại, kể cả khi đơn cũ đã `WITHDRAWN`) |
| `GET /job-applications/my-applications` | `CANDIDATE` | Đơn của chính mình |
| `GET /job-applications/job/:jobId` | `RECRUITER` | Chỉ recruiter sở hữu job đó |
| `GET /job-applications/job/:jobId/stats` | `RECRUITER` | `data`: `{ jobId, viewCount, totalApplications, applied, screening, shortlisted, interview, offer, hired, rejected, withdrawn }` |
| `PATCH /job-applications/:id/withdraw` | `CANDIDATE` | Chỉ chủ đơn, chỉ khi chưa ở trạng thái cuối (`HIRED`/`REJECTED`/`WITHDRAWN`) |
| `PATCH /job-applications/:id/status` | `RECRUITER` | `{ status, note? }` — chỉ recruiter sở hữu job, phải đi đúng chiều pipeline (xem bên dưới) |

⚠️ **Pipeline tuyển dụng đã mở rộng từ 4 trạng thái (`PENDING/ACCEPTED/REJECTED/WITHDRAWN`) thành 8 trạng thái theo từng bước phễu tuyển dụng.** `ApplicationStatus`: `APPLIED → SCREENING → SHORTLISTED → INTERVIEW → OFFER → HIRED`, mỗi bước (trừ `HIRED`) đều có thể rẽ sang `REJECTED`. `WITHDRAWN` là nhánh riêng, candidate tự rút đơn ở bất kỳ bước nào chưa tới trạng thái cuối. `HIRED`/`REJECTED`/`WITHDRAWN` đều là trạng thái cuối — không đổi tiếp được (đổi sai chiều trả `400 BUSINESS_RULE_VIOLATION`).

Mỗi lần đổi status (kể cả withdraw), backend ghi 1 dòng lịch sử vào bảng `ApplicationStatusHistory` (`fromStatus, toStatus, note, changedById, createdAt`) — **nhưng hiện chưa có endpoint nào đọc lại lịch sử này**, chỉ ghi ở tầng DB. Nếu FE cần hiển thị timeline thay đổi trạng thái, cần báo lại backend để mở endpoint đọc.

Trả về job apply → phát event thông báo cho recruiter; đổi status → phát event thông báo cho candidate (xem mục Notification). Conversation chat chỉ mở được khi đơn đã `HIRED` (trước đây là `ACCEPTED`).

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

`type`: `NEW_APPLICATION` (gửi cho recruiter khi có ứng viên apply) | `APPLICATION_STATUS_CHANGED` (gửi cho candidate khi đơn chuyển trạng thái) | `NEW_MESSAGE`. `metadata` (field riêng trong từng notification, khác `metadata` phân trang) chứa `{ applicationId, jobId, status? }`.

⚠️ **Field đánh dấu đã đọc đổi từ `isRead: boolean` sang `readAt: Date | null`** — `readAt === null` nghĩa là chưa đọc, có giá trị nghĩa là đã đọc tại thời điểm đó. FE tự suy ra "đã đọc hay chưa" bằng `readAt != null` thay vì đọc field `isRead` (không còn tồn tại trong response).

### 4.9. Job Alert / Saved Search (`/saved-searches`)

Lưu điều kiện tìm việc để nhận mail digest khi có job mới phù hợp (cron chạy 7h sáng mỗi ngày).

| Method & Path | Auth | Body |
|---|---|---|
| `POST /saved-searches` | `CANDIDATE` | `{ keyword?, location?, categoryId?, employmentType?, workMode? }` |
| `GET /saved-searches` | `CANDIDATE` | Của chính mình |
| `DELETE /saved-searches/:id` | `CANDIDATE` | Chỉ chủ sở hữu (`204`) |

### 4.10. File Upload (`/files`)

| Method & Path | Auth | Ghi chú |
|---|---|---|
| `POST /files/upload` | 🔒 | `multipart/form-data`: field `file` (ảnh: jpeg/png/webp/gif, tối đa **5MB**), field `folder?` (string, mặc định `general`, vd `avatars`) → `data`: `{ url }` |

Dùng endpoint này để lấy `avatarUrl` trước khi gọi `PATCH /users/profile`, hoặc `logoUrl` trước khi tạo/sửa company.

### 4.11. Chat (`/conversations`, `/messages`) + WebSocket

Conversation luôn gắn với 1 `JobApplication` đã `HIRED` (trước đây là `ACCEPTED` — đổi theo pipeline mới ở mục 4.6) — recruiter là người khởi tạo.

| Method & Path | Auth | Ghi chú |
|---|---|---|
| `POST /conversations` | `RECRUITER` | `{ applicationId }` — application phải `HIRED`, recruiter phải là chủ job. Idempotent (gọi lại nhiều lần trả về cùng 1 conversation) |
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

### 4.12. Interview (`/interviews`)

Recruiter đặt/dời/huỷ lịch phỏng vấn cho 1 `JobApplication`. Bắt buộc có ít nhất 1 trong 2 field `location`/`meetingLink` (recruiter tự dán link Meet/Zoom thủ công, hệ thống không tự sinh link). Candidate được gửi email ở cả 3 hành động.

| Method & Path | Auth | Body / Ghi chú |
|---|---|---|
| `POST /interviews` | `RECRUITER` | `{ jobApplicationId, scheduledAt, location?, meetingLink?, note?, durationMinutes? }` — chỉ recruiter sở hữu job của application đó |
| `PATCH /interviews/:id` | `RECRUITER` | Dời lịch — `{ scheduledAt?, location?, meetingLink?, note?, durationMinutes? }`, `scheduledAt` mới phải ở tương lai, chỉ áp dụng khi interview đang `SCHEDULED`/`RESCHEDULED` |
| `PATCH /interviews/:id/cancel` | `RECRUITER` | Chỉ owner, chỉ khi đang `SCHEDULED`/`RESCHEDULED` |
| `PATCH /interviews/:id/complete` | `RECRUITER` | Đánh dấu đã hoàn thành phỏng vấn — chỉ khi đang `SCHEDULED`/`RESCHEDULED` |
| `PATCH /interviews/:id/no-show` | `RECRUITER` | Đánh dấu ứng viên không đến — chỉ khi đang `SCHEDULED`/`RESCHEDULED` |
| `GET /interviews/application/:applicationId` | `CANDIDATE`/`RECRUITER` | Candidate chủ đơn hoặc recruiter chủ job mới xem được |

⚠️ **`InterviewStatus` mở rộng thêm `COMPLETED`/`NO_SHOW`**: `SCHEDULED`/`RESCHEDULED` (2 trạng thái "còn hiệu lực", có thể cancel/complete/no-show/reschedule tiếp) → `RESCHEDULED` / `CANCELLED` / `COMPLETED` / `NO_SHOW` (4 trạng thái cuối). Gọi cancel/complete/no-show/reschedule khi đã ở 1 trong 4 trạng thái cuối sẽ trả lỗi. Response `Interview` có thêm field `durationMinutes: number | null` (phút, tuỳ chọn khi đặt lịch). Không có in-app notification (`NotificationType`) cho interview, không đính kèm file `.ics` — chỉ gửi email.

### 4.13. RBAC Admin (`/admin/roles`, `/admin/permissions`)

Quản lý role → permission mapping (database-driven, đổi quyền không cần deploy lại code). Toàn bộ endpoint yêu cầu permission `role:permission:manage` (mặc định chỉ role `ADMIN` có).

| Method & Path | Auth | Ghi chú |
|---|---|---|
| `GET /admin/roles` | `ADMIN` | Danh sách role |
| `GET /admin/roles/:id` | `ADMIN` | Chi tiết 1 role |
| `GET /admin/permissions` | `ADMIN` | Danh sách toàn bộ permission có trong hệ thống |
| `GET /admin/roles/:id/permissions` | `ADMIN` | Danh sách permission hiện gán cho role |
| `PUT /admin/roles/:id/permissions` | `ADMIN` | `{ permissionIds: string[] }` — **thay thế toàn bộ** danh sách permission của role (không phải merge); cache permission (TTL ~30s) sẽ tự invalidate sau khi đổi |

---

## 5. Enums tham khảo nhanh

| Enum | Giá trị |
|---|---|
| `UserRole` (chỉ còn ở tầng validation DTO, không phải Postgres enum nữa — xem mục 2) | `CANDIDATE`, `RECRUITER`, `ADMIN` |
| `UserStatus` | `PENDING`, `ACTIVE`, `BLOCKED` |
| `Gender` | `MALE`, `FEMALE`, `OTHER` |
| `CvStatus` | `DRAFT`, `PUBLISHED` |
| `CvFileType` | `PDF`, `DOC`, `DOCX` |
| `JobStatus` | `DRAFT`, `OPEN`, `CLOSED` |
| `EmploymentType` (thay cho `JobType` cũ) | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP` |
| `WorkMode` (tách riêng khỏi `EmploymentType`, độc lập) | `ONSITE`, `HYBRID`, `REMOTE` |
| `JobLevel` | `INTERN`, `FRESHER`, `JUNIOR`, `MIDDLE`, `SENIOR`, `MANAGER` |
| `JobSortOption` (query `sort` của `GET /jobs`) | `newest`, `salary_desc`, `views_desc` |
| `ApplicationStatus` (mở rộng từ 4 → 8 giá trị) | `APPLIED`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`, `WITHDRAWN` |
| `CompanySize` | `SIZE_1_10`, `SIZE_11_50`, `SIZE_51_200`, `SIZE_201_500`, `SIZE_500_PLUS` |
| `CompanyType` (DB-only, chưa expose qua API — xem mục 4.2) | `PRODUCT`, `OUTSOURCING`, `STARTUP`, `CONSULTING` |
| `NotificationType` | `NEW_APPLICATION`, `APPLICATION_STATUS_CHANGED`, `NEW_MESSAGE` |
| `ConversationStatus` | `ACTIVE`, `ARCHIVED` |
| `MessageType` | `TEXT`, `IMAGE`, `FILE`, `SYSTEM` (chỉ server tạo, không nhận từ client) |
| `ChatParticipantRole` | `CANDIDATE`, `RECRUITER` |
| `InterviewStatus` (thêm `COMPLETED`/`NO_SHOW`) | `SCHEDULED`, `RESCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |

`industry` (free-text field cũ trên `Company`) đã bị xoá hoàn toàn khỏi schema — không còn trong danh sách enum/field nào.

---

## 6. Những điểm dễ gây bug tích hợp (đọc kỹ trước khi code)

1. **Refresh token đổi mỗi lần dùng** — FE phải cập nhật lại refresh token lưu trong storage sau MỌI lần gọi `/auth/refresh`, không chỉ lưu 1 lần lúc login.
2. **`PATCH /users/profile` và `PATCH /admin/users/:id` không trả entity mới** — `data: null`, thông báo nằm ở field `message` cấp envelope (giống mọi endpoint action-only khác như `/auth/verify`, `/auth/forgot-password`...). Muốn cập nhật UI, gọi lại `GET /users/me` (hoặc `GET /admin/users`) sau khi PATCH thành công.
3. **`Bookmark` response không kèm chi tiết job** dù DTO có khai báo field `job` — luôn là `undefined`. Phải tự join dữ liệu ở FE bằng cách gọi thêm `GET /jobs/:jobId`. (`JobApplication` thì khác: `candidate` đã được populate sẵn trên `listByJob`, nhưng `job`/`cv` lồng vẫn không có — dùng `jobId`/`cvId` để tự gọi thêm nếu cần.)
4. **Apply lại job đã rút đơn (`WITHDRAWN`) sẽ bị từ chối (409)** — hệ thống chưa cho phép apply lại cùng 1 job dù đơn cũ đã withdraw.
5. **Đăng ký không tự chặn role `ADMIN`** — `POST /auth/register` cho phép `role: "ADMIN"` như một lựa chọn công khai (không có cơ chế duyệt/whitelist). Đây là vấn đề tồn tại từ trước, **chưa được fix** trong đợt refactor này. FE nên **ẩn lựa chọn ADMIN khỏi form đăng ký công khai** (chỉ cho chọn CANDIDATE/RECRUITER), việc tạo admin nên làm qua kênh khác.
6. **`ApplicationStatusHistory` được ghi ở tầng DB nhưng chưa có endpoint đọc lại** — nếu FE cần hiển thị timeline lịch sử thay đổi trạng thái đơn ứng tuyển, tính năng này chưa sẵn sàng, cần báo lại backend.
7. **`GET /jobs` chỉ trả job `status = OPEN`** — job `DRAFT`/`CLOSED` không xuất hiện, kể cả khi filter theo `companyId`. Dùng **`GET /jobs/mine`** (mới, mục 4.4) để recruiter xem toàn bộ job của mình bất kể status.
8. **CV không còn hỗ trợ thay file qua `PATCH`** — `PATCH /cvs/:id` chỉ đổi được `title`. Muốn đổi file phải xoá CV cũ và tạo CV mới (`POST /cvs`).
9. **`Company.companyType`** tồn tại ở DB nhưng chưa có trong bất kỳ DTO nào — đừng gửi field này lên API cho tới khi backend expose chính thức.
