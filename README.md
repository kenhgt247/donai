# Đơn AI

**Biến mọi sản phẩm thành kịch bản bão đơn trong 60 giây.**

Micro-SaaS cho chủ shop TikTok Shop & Shopee: nhập sản phẩm → AI viết 3 kịch bản → giọng đọc AI tiếng Việt (VieNeu-TTS) → video review dọc 9:16 từ ảnh sản phẩm. Thanh toán bằng QR ngân hàng, cộng Credit tự động qua webhook SePay.

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
| `supabase/migrations` | 5 file SQL, chạy lần lượt 0001 → 0005 |
| `worker/` | Chương trình dựng video bằng FFmpeg, chạy trên VPS (xem `worker/README.md`) |

## Chạy lần đầu

1. **Supabase**: tạo project, vào SQL Editor chạy lần lượt các file trong `supabase/migrations`. Vào Authentication → URL Configuration, thêm `https://<tên-miền>/auth/callback` vào Redirect URLs.
2. **Vercel**: Import repo này → thêm các biến môi trường theo `.env.example` → Deploy.
3. **SePay**: tạo webhook trỏ về `https://<tên-miền>/api/payment-webhook`, xác thực bằng API Key (giống `SEPAY_WEBHOOK_API_KEY`).
4. **VPS**: chạy VieNeu-TTS và `worker/` bằng Docker (hướng dẫn trong `worker/README.md`).

## Chạy trên máy

```bash
npm install
cp .env.example .env.local   # rồi điền giá trị thật
npm run dev                  # mở http://localhost:3000
```

Mỗi lần đẩy code lên nhánh `main`, GitHub Actions tự build web và dựng thử 1 video mẫu để kiểm tra (tab **Actions**).
