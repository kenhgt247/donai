# Đơn AI — Video Worker

Chương trình chạy liên tục trên VPS, nhận yêu cầu dựng video từ Supabase, ghép **ảnh sản phẩm + giọng đọc VieNeu + phụ đề** thành MP4 1080×1920 rồi tải lên Supabase Storage.

## Cài đặt (làm 1 lần)

1. Chạy file `supabase/migrations/0004_video_jobs.sql` trong Supabase SQL Editor.
2. Trên VPS (đã có VieNeu-TTS chạy ở cổng 8000), cài Docker rồi chép thư mục `worker/` lên.
3. Đổi tên `.env.example` → `.env`, điền `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`.
4. Chạy: `docker compose up -d --build`
5. Xem worker chạy: `docker compose logs -f worker` — thấy dòng "Video worker ... bắt đầu" là được.

## Cấu hình VPS gợi ý

- 4 nhân CPU, 8 GB RAM: đủ cho VieNeu (CPU) + 1 worker. Dựng 30 giây video mất khoảng 30–40 giây.
- Đông khách: `docker compose up -d --scale worker=2` (mỗi worker cần ~2 nhân CPU).

## Logo "Đơn AI" trên video

Chỉ video của khách **chưa từng nạp tiền** (đang dùng Credit tặng khi đăng ký) mới có chữ "Đơn AI" nhỏ ở góc trên bên phải. Khách đã nạp tiền thành công ít nhất 1 lần luôn nhận video sạch. API tự quyết định khi tạo yêu cầu, ghi vào cột `watermark` của bảng `video_jobs`.

## Khi có sự cố

- Video lỗi → khách **tự được hoàn credit**, lý do lỗi ghi ở cột `error_message` trong bảng `video_jobs`.
- Worker bị tắt giữa chừng → sau 10 phút việc đó tự được làm lại (tối đa 3 lần), quá 3 lần thì báo lỗi và hoàn credit.
