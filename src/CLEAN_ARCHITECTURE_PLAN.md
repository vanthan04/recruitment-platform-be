# Clean Architecture / DDD — Remediation Plan

> Ghi lại từ đợt audit ngày 2026-09-02 (rà soát toàn bộ `src/modules/*` theo tiêu chí Clean Architecture/DDD). Phase 1, 2, 5, 6, 7 (bước 1-2) đã implement + `npm test` pass (73/73) — xem ghi chú "✅ Done" ở từng phase. Phase 3 giữ nguyên theo khuyến nghị, Phase 4 để backlog.
>
> Xem tổng quan kiến trúc hiện có ở [CODEBASE_SUMMARY.md](../CODEBASE_SUMMARY.md), backlog tech-debt khác (test coverage, CI/CD...) ở [ROADMAP.md](../ROADMAP.md).

**Kết luận audit:** phần lõi (domain layer thuần túy, không leak framework, không vòng phụ thuộc ngược, controller không đụng Prisma trực tiếp, repository port 100% nhất quán) đã đúng chuẩn ở toàn bộ 14 module. Vấn đề là drift cục bộ — tập trung ở `auth`, `user`, `file-upload` (module cũ, viết trước khi chuẩn CQRS/DDD được áp dụng đồng bộ) và 1 mẫu ownership-check bị lặp thủ công xuyên module.

---

## Phase 1 — Local mail port cho `interview` + `job-alert` ✅ Done (effort thấp)

**Vấn đề:** `interview` (3 command handler) và `job-alert/send-job-alert-digests.command.ts` import thẳng `IMailService` từ module `mail` (`@/modules/mail/domain/ports/mail.service.port`) thay vì tạo local port riêng bọc lại — không theo đúng quy ước cross-module mà `application` module đang làm chuẩn (`IJobLookupPort` bọc `IJobRepository`).

**Việc cần làm:**
- Module `interview`: thêm `application/ports/mail.port.ts` (`IInterviewMailPort`) + `infrastructure/adapters/mail.adapter.ts` (wrap `IMailService`), đổi 3 command handler (`schedule-interview`, `reschedule-interview`, `cancel-interview`) sang dùng port mới, cập nhật `interview.module.ts` provider wiring.
- Module `job-alert`: tương tự — thêm `IJobAlertMailPort` + adapter, đổi `send-job-alert-digests.command.ts`.
- **Không đổi** `application/auth` — vì `auth` đã có sẵn `IAuthMailServicePort`/`AuthMailAdapter` đúng pattern rồi, chỉ 2 module trên đang thiếu.

**File chạm:** ~4 file mới/module × 2 module, 3-4 file sửa import.

---

## Phase 2 — Shared `ensureOwner` helper cho ownership-check xuyên module ✅ Done (effort thấp-trung bình)

**Vấn đề:** `Job.ensureOwner()` đã có sẵn ở domain entity nhưng bị bypass ở 7 chỗ vì các module khác chỉ nhận về DTO (`JobLookupResult`) qua local port, không phải entity `Job` thật — nên không gọi thẳng được. Mỗi handler tự viết `if (job.postedById !== recruiterId) throw new UnauthorizedDomainException(...)`.

Danh sách chỗ đang lặp:
- `src/modules/application/application/queries/list-applications-by-job.query.ts:35`
- `src/modules/application/application/queries/get-job-stats.query.ts:28`
- `src/modules/application/application/commands/update-application-status.command.ts:45`
- `src/modules/interview/application/commands/schedule-interview.command.ts:53`
- `src/modules/interview/application/commands/reschedule-interview.command.ts:51`
- `src/modules/interview/application/commands/cancel-interview.command.ts:41`
- `src/modules/chat/application/commands/create-conversation.command.ts:60`

**Việc cần làm:** thêm 1 hàm tiện ích dùng chung ở `src/common/utils/ownership.util.ts`, ví dụ:
```ts
export function ensureOwner(ownerId: string, requesterId: string, message?: string): void {
  if (ownerId !== requesterId) throw new UnauthorizedDomainException(message);
}
```
rồi thay từng chỗ trên bằng `ensureOwner(job.postedById, recruiterId, 'Only the job poster can ...')`. Không đổi domain entity `Job.ensureOwner()` (giữ nguyên cho trường hợp có entity thật, ví dụ trong chính module `job`).

**File chạm:** 1 file mới + 7 file sửa (mỗi chỗ 1-2 dòng).

---

## Phase 3 — `job-alert` bỏ import trực tiếp `JobType` từ module `job` (effort thấp)

**Vấn đề:** `job-alert/application/commands/create-saved-search.command.ts:6` import `JobType` thẳng từ `@/modules/job/domain/value-objects/job-type.vo` — vi phạm nhẹ ranh giới module.

**Việc cần làm:** cân nhắc 1 trong 2 hướng — (a) định nghĩa lại `JobType` như 1 union type/enum cục bộ trong `job-alert` (chấp nhận trùng lặp định nghĩa nhỏ, đổi lại tách rời hoàn toàn), hoặc (b) chấp nhận giữ nguyên vì `JobType` là value-object thuần enum (không phải entity/repository, rủi ro coupling thấp) — **khuyến nghị (b)**, đánh dấu là chấp nhận được, không cần sửa, vì đây là kiểu chia sẻ enum/value-object đơn giản chứ không phải leak entity hay logic.

---

## Phase 4 — `bookmark`, `job-alert`: domain entity đang "anemic" (effort trung bình)

**Vấn đề:** `bookmark.entity.ts` và `saved-search.entity.ts` chỉ là data holder (`Object.assign`), không có method nào — toàn bộ logic (toggle tồn tại/tạo/xoá) nằm ở command handler.

**Đánh giá:** rủi ro thấp vì 2 entity này gần như không có invariant nghiệp vụ thật sự (bookmark chỉ là 1 record liên kết user-job, saved-search chỉ là điều kiện tìm kiếm lưu lại) — khác với `user`/`Job` là aggregate có state machine thật. **Có thể để nguyên nếu không có nhu cầu thêm rule**, chỉ nên làm nếu sau này có thêm nghiệp vụ (ví dụ giới hạn số bookmark/user, giới hạn số saved-search/user) — lúc đó thêm invariant vào entity là chỗ đúng để đặt rule, không phải thêm `if` mới vào handler.

**Việc cần làm (nếu làm):** không có gì cấp bách — để backlog, không ưu tiên.

---

## Phase 5 — `user` module: entity anemic + admin đổi status/role không qua domain rule ✅ Done (effort trung bình)

**Vấn đề:**
- `user.entity.ts`/`profile.entity.ts` không có method nào.
- `admin-update-user-status.command.ts:30-35` sửa thẳng `user.status`/`user.role` trong handler — không có transition rule nào được enforce (ví dụ: không có gì ngăn admin đổi 1 user đã `BLOCKED` thành `PENDING` một cách vô lý, hay validate chuyển role).
- Dùng `NotFoundException` (raw NestJS) thay vì `EntityNotFoundException` ở `admin-update-user-status.command.ts`, `update-profile.command.ts`, `get-my-profile.query.ts`.

**Việc cần làm:**
- Thêm method trên `User` entity: `changeStatus(newStatus: UserStatus)`, `changeRole(newRole: UserRole)` — chuyển logic transition (nếu có) vào đây, kể cả đơn giản chỉ là gán giá trị, để có 1 chỗ duy nhất mở rộng rule sau này.
- Đổi 3 chỗ raw `NotFoundException` → `EntityNotFoundException`.
- Cập nhật 3 command/query handler gọi qua entity method thay vì gán trực tiếp field.

**File chạm:** `user.entity.ts`, `admin-update-user-status.command.ts`, `update-profile.command.ts`, `get-my-profile.query.ts`.

---

## Phase 6 — `file-upload`: chuyển sang CQRS bus + domain exception ✅ Done (chỉ phần exception, effort trung bình)

**Vấn đề:** dùng plain service (`FileUploadService`, inject thẳng vào controller, không qua `CommandBus`), không có domain layer, ném raw `BadRequestException` (`upload-file.command.ts:22,26`) thay vì `BusinessRuleViolationException`.

**Việc cần làm:**
- Đổi 2 chỗ `BadRequestException` → `BusinessRuleViolationException` (validate size/mimetype).
- Cân nhắc giữ nguyên phần "không CQRS bus" — module này không có domain rule phức tạp (chỉ validate + gọi S3 upload), việc ép sang CQRS command/handler đầy đủ có thể là over-engineering. **Khuyến nghị: chỉ sửa phần exception, không bắt buộc đổi sang CQRS.**

---

## Phase 7 — `auth` module: thiếu domain layer + dùng plain service ✅ Bước 1-2 Done, bước 3 bỏ qua (effort cao, rủi ro cao nhất)

**Đã làm (bước 1-2):**
- Đổi exception theo đúng status hiện tại (không đổi status để tránh phá contract API_GUIDE.md): `ForbiddenException` (403, `auth.service.ts` — invalid/rotated refresh token) → `UnauthorizedDomainException` (vẫn 403); `NotFoundException` (404, forgot/reset-password/verify-email) → `EntityNotFoundException` (vẫn 404); `ConflictException` (409, register) → `DuplicateEntityException` (vẫn 409).
- **Cố ý giữ nguyên** `UnauthorizedException` (401) ở 2 nơi: `login.query.ts` (sai email/password) và `change-password.command.ts` (sai mật khẩu cũ) — vì API_GUIDE.md đã tài liệu hoá rõ "401 = sai mật khẩu", và bộ domain exception hiện tại không có case nào map ra 401 (`UnauthorizedDomainException` map ra 403). Đổi 2 chỗ này sẽ đổi status trả về, phá hợp đồng API đang có — không sửa.
- `auth-user-repository.port.ts`: thêm interface cục bộ `AuthUserRecord` (chỉ `id, email, password?, verifyCode?, role, status`), bỏ import `User` entity của module `user` khỏi signature. `AuthUserAdapter` map `User` → `AuthUserRecord`.
- `auth.service.ts`: đổi từ inject thẳng `IUserRepository` (module `user`) sang dùng `IAuthUserRepositoryPort` (port riêng của `auth`) cho `refreshTokens()`; xoá method `validateUser()` (dead code — không có nơi nào gọi, `JwtStrategy` tự decode JWT payload chứ không gọi qua đây).
- Cập nhật `register.handler.spec.ts` khớp `DuplicateEntityException` mới.

**Bỏ qua:** bước 3 (domain layer tối thiểu cho auth, đổi `auth.controller.ts` sang CQRS bus) — đánh giá không đáng công sức thêm ở lần này, để lại nếu sau này auth cần thêm business rule thật sự.

**Vấn đề (lớn nhất trong audit):**
- Không có folder `domain/` — không có entity/value-object riêng cho auth.
- `auth.controller.ts:19` inject thẳng `AuthService` (plain service), không qua `CommandBus`/`QueryBus` như 13/15 controller khác.
- Ném raw NestJS exception rải rác: `ForbiddenException` (`auth.service.ts:80,88,93`), `UnauthorizedException` (`change-password.command.ts:24,29`, `login.query.ts:19,24`), `NotFoundException` (`forgot-password.command.ts:24`, `verify-email.command.ts:19`, `reset-password.command.ts:21`), `ConflictException` (`register.command.ts:24`).
- `auth-user-repository.port.ts:1` import thẳng `User` entity từ module `user` vào signature của port riêng — leak domain entity module khác vào port của `auth`.

**Vì sao để cuối:** đây là module có nhiều luồng nhạy cảm nhất (JWT, refresh token rotation, đăng nhập nhiều thiết bị) và đã có test (`register.use-case.spec.ts`, `login.use-case.spec.ts`) — sửa cấu trúc lớn ở đây rủi ro regression cao nhất trong toàn bộ audit, nên làm sau cùng, từng bước nhỏ, chạy lại test sau mỗi bước.

**Việc cần làm (từng bước, không làm 1 lần):**
1. Đổi toàn bộ raw NestJS exception → domain exception tương ứng (`ForbiddenException`→`UnauthorizedDomainException`, `UnauthorizedException`→`UnauthorizedDomainException`, `NotFoundException`→`EntityNotFoundException`, `ConflictException`→`DuplicateEntityException`) — làm trước vì rủi ro thấp nhất, không đổi luồng logic, chỉ đổi loại exception (đã có `GlobalExceptionFilter` map sẵn đúng HTTP status cho domain exception).
2. `auth-user-repository.port.ts` — đổi kiểu trả về khỏi `User` entity của module `user`, dùng 1 shape cục bộ (`AuthUserRecord`) chỉ chứa field `auth` thực sự cần (`id, email, password, verifyCode, status, role`).
3. Cân nhắc thêm domain layer tối thiểu: 1 value-object hoặc rule nhỏ nếu có (ví dụ rule "password phải hash trước khi lưu" hiện nằm rải rác ở nhiều command — có thể gom vào 1 chỗ), nhưng **không bắt buộc phải build đầy đủ entity/CQRS bus như module khác** — đánh giá lại có đáng công sức hay không sau khi làm xong bước 1-2.

**File chạm:** toàn bộ `src/modules/auth/application/**`, `auth.controller.ts` (nếu đổi sang CQRS bus).

---

## Thứ tự khuyến nghị nếu làm dần

1. Phase 1 (mail port) — nhanh, không rủi ro.
2. Phase 3 (job-alert JobType) — quyết định giữ nguyên, không cần code.
3. Phase 2 (ensureOwner helper) — nhanh, gọn, giảm trùng lặp rõ rệt.
4. Phase 6 (file-upload exception) — nhỏ, 2 dòng.
5. Phase 5 (user entity + exception) — trung bình.
6. Phase 4 (bookmark/job-alert entity) — để backlog, chỉ làm khi có nghiệp vụ mới.
7. Phase 7 (auth) — làm sau cùng, từng bước nhỏ, chạy test sau mỗi bước.
