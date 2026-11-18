// Tuỳ chọn giọng văn & giọng đọc — dùng chung cho giao diện và API.

export const CREDIT_COST = 1; // Mỗi lần tạo 3 kịch bản + 3 file giọng đọc

export const TONES = {
  trend: {
    label: "Bắt trend hài hước",
    desc: "Vui nhộn, bắt trend TikTok",
    prompt:
      "Giọng văn trẻ trung, hài hước, bắt trend mạng xã hội, câu ngắn, có yếu tố bất ngờ khiến người xem bật cười.",
  },
  expert: {
    label: "Chuyên gia review",
    desc: "Phân tích, tạo niềm tin",
    prompt:
      "Giọng văn như một người review có chuyên môn: nêu rõ ưu điểm thật, so sánh hợp lý, đáng tin cậy, không phóng đại.",
  },
  urgent: {
    label: "Thúc giục chốt đơn",
    desc: "Tạo cảm giác khan hiếm",
    prompt:
      "Giọng văn dồn dập, tạo cảm giác cần mua ngay, nhấn mạnh lợi ích và lý do không nên bỏ lỡ. Chỉ nhắc khuyến mãi nếu thông tin sản phẩm có ghi.",
  },
} as const;

// vieneuVoice = tên giọng có sẵn (preset) của VieNeu-TTS.
// Hãy nghe thử danh sách giọng (GET /v1/voices trên máy chủ VieNeu) rồi đổi tên cho đúng ý.
export const VOICES = {
  north_female: { label: "Nữ miền Bắc", desc: "Nhẹ nhàng, rõ ràng", vieneuVoice: "Ngọc Linh" },
  south_female: { label: "Nữ miền Nam", desc: "Ngọt ngào, gần gũi", vieneuVoice: "Thùy Dung" },
  male_warm: { label: "Nam trầm ấm", desc: "Chắc chắn, tin cậy", vieneuVoice: "Minh Đức" },
} as const;

export type ToneKey = keyof typeof TONES;
export type VoiceKey = keyof typeof VOICES;

export const PRODUCT_MIN = 10;
export const PRODUCT_MAX = 3000;
