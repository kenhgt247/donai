# Đơn AI

**Biến mọi sản phẩm thành kịch bản bão đơn trong 60 giây.**

Micro-SaaS cho chủ shop TikTok Shop & Shopee: nhập sản phẩm → AI viết 3 kịch bản → giọng đọc AI tiếng Việt (VieNeu-TTS, file WAV) → video review dọc 9:16 từ ảnh sản phẩm. Thanh toán bằng QR ngân hàng, cộng Credit tự động qua webhook SePay.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/app/page.tsx` | Trang chủ + khu trải nghiệm thử |
| `src/app/login`, `src/app/auth/callback` | Đăng nhập bằng link email |
| `src/app/(app)/dashboard` | Trang tạo kịch bản |
| `src/app/(app)/billing` | Nạp Credit (QR VietQR, tự cập nhật số dư) |
| `src/app/api/generate` | Trừ 1 Credit → Claude viết 3 kịch bản → VieNeu đọc kịch bản 1 |
| `src/app/api/payment-webhook` | Nhận webhook SePay, cộng Credit (chống cộng trùng) |
| `src/app/api/video` | Đặt dựng video (2 Credits) và xem tiến độ |
| `supabase/migrations` | 6 file SQL, chạy lần lượt 0001 → 0006 (hoặc dán 1 lần file `supabase/chay-1-lan.sql`) |
| `worker/` | Chương trình dựng video bằng FFmpeg, chạy trên VPS (xem `worker/README.md`) |

## Chạy lần đầu

1. **Supabase**: tạo project, vào SQL Editor chạy lần lượt các file trong `supabase/migrations`. Vào Authentication → URL Configuration, thêm `https://<tên-miền>/auth/callback` vào Redirect URLs.
2. **Cloudflare** (web chạy trên Cloudflare Workers, gói miễn phí):
   1. Vào dash.cloudflare.com → **Workers & Pages** → **Create** → **Import a repository** → chọn repo `donai`.
   2. **Build command**: `npx opennextjs-cloudflare build` — **Deploy command**: `npx wrangler deploy`.
   3. Mục **Build variables**: nhập 5 biến bắt đầu bằng `NEXT_PUBLIC_` trong `.env.example` (các biến này được gắn vào web lúc build).
   4. Sau khi tạo xong, vào Worker `donai` → **Settings** → **Variables and Secrets**: nhập TẤT CẢ biến trong `.env.example` (khóa bí mật chọn loại **Secret**).
   5. Bấm **Deploy** lại. Web có địa chỉ dạng `https://donai.<tên-bạn>.workers.dev` (gắn tên miền riêng ở **Settings → Domains & Routes**).
3. **SePay**: tạo webhook trỏ về `https://<tên-miền>/api/payment-webhook`, xác thực bằng API Key (giống `SEPAY_WEBHOOK_API_KEY`).
4. **VPS**: chạy VieNeu-TTS và `worker/` bằng Docker (hướng dẫn trong `worker/README.md`).

> Gói Workers miễn phí giới hạn 10 ms CPU mỗi lượt và 3 MiB dung lượng web sau nén. Vì vậy giọng đọc được lưu dạng WAV (không nén MP3 trên web). Nếu sau này đông khách hoặc gặp lỗi "Exceeded CPU", nâng lên Workers Paid (5 USD/tháng).

## Chạy trên máy

```bash
npm install
cp .env.example .env.local   # rồi điền giá trị thật
npm run dev                  # mở http://localhost:3000
npm run preview              # chạy thử y như trên Cloudflare
```

Mỗi lần đẩy code lên nhánh `main`, Cloudflare tự cập nhật web; GitHub Actions tự build web và dựng thử 1 video mẫu để kiểm tra (tab **Actions**).
