# Phạm vi ngành: chỉ IT, vĩnh viễn

## Quyết định hiện tại (đã cập nhật)

Nền tảng chỉ phục vụ **tuyển dụng ngành IT** (không phải job board đa
ngành). Ban đầu đây là quyết định "mềm", chỉ ở mức nội dung (xem lịch
sử git của phiên bản cũ file này) — vẫn giữ `Company.industry` như 1
field free-text phòng khi sau này mở rộng sang ngành khác.

Kế hoạch đó đã thay đổi: `Company.industry` đã bị **xoá hoàn toàn khỏi
schema và codebase** trong đợt refactor lớn của recruitment-platform
(xem commit `refactor(company): remove industry field` ở backend).
Nền tảng giờ cam kết chỉ phục vụ IT, không còn là "mặc định tạm thời"
nữa.

## Những gì đã bị xoá

- `Company.industry` (Prisma schema, migration, domain entity, DTO,
  mapper, filter ở repository, response DTO)
- Param search/filter `industry` trên `GET /companies`
- Field industry và UI filter tương ứng ở frontend (form company, card
  company, trang chi tiết company, filter ở danh sách company)

## Những gì vẫn còn phản ánh phạm vi IT-only (không đổi)

- `Category` (`prisma/schema.prisma`) vẫn chỉ có `name` và `slug` —
  free text, không phải enum — và danh sách `CATEGORIES` trong
  `prisma/seed.ts` vẫn chỉ chứa các vị trí IT (Frontend, Backend,
  DevOps, QA, Mobile, Data/AI, Security, BA/Product, UI/UX, IT Support).
- `recruitment-platform-fe/src/components/home/hero-search.tsx` —
  `POPULAR_KEYWORDS` chỉ liệt kê vị trí IT.
- `recruitment-platform-fe/src/components/home/category-grid.tsx` —
  `ICON_RULES` vẫn còn entry cho các category ngoài IT (kế toán,
  marketing, y tế, xây dựng, ...) để lại từ trước khi có quyết định
  ban đầu; hiện tại các entry này không có tác dụng (không tồn tại
  category tương ứng) và giữ lại không tốn gì.

## Nếu sau này thêm ngành thứ hai

Vì `Company.industry` đã bị xoá, một lần pivot đa ngành trong tương lai
cần thêm 1 field mới (schema + migration + wire đầy đủ backend/frontend)
chứ không chỉ đơn giản là điền dữ liệu vào cột free-text cũ. Coi đó là
1 tính năng mới, không phải revert lại quyết định này:

1. Thêm category cho ngành mới vào `CATEGORIES` trong `prisma/seed.ts`
   (hoặc qua CRUD Category sẵn có của admin — `POST /categories`).
2. Thêm từ khoá đại diện vào `POPULAR_KEYWORDS` trong `hero-search.tsx`.
3. Cập nhật metadata ở `src/app/layout.tsx` và nội dung hero ở
   `src/app/(main)/page.tsx` nếu chữ "IT" cần trở lại thành từ chung
   chung hơn.
4. Kiểm tra `ICON_RULES` trong `category-grid.tsx` đã bao phủ tên
   category mới.
5. Quyết định xem company có cần lại field ngành/sector hay không, nếu
   có thì thêm lại một cách chủ động (schema + migration + DTO + UI),
   thay vì giả định cột free-text cũ vẫn còn tồn tại.
