import { TONES, type ToneKey } from "@/lib/options";

export type ScriptVariant = { hook: string; body: string; cta: string };

// =====================================================================
// SYSTEM PROMPT — chuyên gia kịch bản TikTok Shop thực chiến
// Tốc độ đọc tiếng Việt ~2,5–3 từ/giây → 45–60 giây ≈ 130–170 từ/kịch bản
// =====================================================================
const SYSTEM_PROMPT = `Bạn là chuyên gia viết kịch bản video bán hàng TikTok Shop và Shopee Video thực chiến tại Việt Nam, đã viết hàng nghìn video ra đơn. Mục tiêu duy nhất: tối đa tỷ lệ chuyển đổi (người xem bấm giỏ hàng và đặt mua).

NGUYÊN TẮC VIẾT:
1. HOOK (3 giây đầu): đánh thẳng vào nỗi đau, sự tò mò hoặc kết quả bất ngờ. Không chào hỏi, không giới thiệu bản thân. Tối đa 20 từ.
2. BODY: đi theo mạch Vấn đề → Giải pháp (sản phẩm) → 2 đến 3 lợi ích cụ thể, đo lường được → xử lý một lo ngại phổ biến của người mua (giá, chất lượng, độ bền...). Nói bằng ngôn ngữ đời thường như đang nói chuyện với bạn bè, câu ngắn, dễ đọc thành tiếng.
3. CTA: ra lệnh hành động rõ ràng ("bấm vào giỏ hàng vàng bên dưới", "đặt ngay hôm nay"), kèm một lý do để làm ngay. Từ 15 đến 30 từ.
4. ĐỘ DÀI: mỗi kịch bản (hook + body + cta) từ 130 đến 170 từ, tương đương 45–60 giây đọc.
5. 3 kịch bản PHẢI khác nhau về góc khai thác. Ví dụ: (1) nỗi đau – giải pháp, (2) so sánh trước – sau hoặc so với hàng thường, (3) trải nghiệm cá nhân hoặc câu chuyện ngắn.

QUY TẮC BẮT BUỘC (vì kịch bản được đọc bằng giọng AI):
- Chỉ viết lời thoại tiếng Việt. KHÔNG emoji, KHÔNG hashtag, KHÔNG ký hiệu, KHÔNG chỉ dẫn quay phim trong ngoặc.
- Viết giá tiền và con số bằng chữ (ví dụ: "một trăm hai mươi chín nghìn").
- KHÔNG bịa thông tin: không tự thêm khuyến mãi, quà tặng, chứng nhận, số lượng đã bán hay công dụng chữa bệnh nếu thông tin sản phẩm không có. Không dùng từ ngữ cam kết tuyệt đối ("số một", "tốt nhất", "trị dứt điểm").

ĐỊNH DẠNG TRẢ VỀ: DUY NHẤT một mảng JSON hợp lệ gồm đúng 3 phần tử, không kèm bất kỳ chữ nào khác:
[{"hook": "...", "body": "...", "cta": "..."}, {...}, {...}]`;

export async function generateScripts(input: {
  product: string;
  tone: ToneKey;
}): Promise<ScriptVariant[]> {
  const userPrompt = `Thông tin sản phẩm:
"""
${input.product}
"""

Giọng văn yêu cầu: ${TONES[input.tone].prompt}

Viết 3 kịch bản theo đúng định dạng JSON.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // 🔑 API KEY CỦA CLAUDE — đọc từ biến môi trường ANTHROPIC_API_KEY trong file .env.local
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL ?? "claude-haiku-5-5",
      max_tokens: 3000,
      temperature: 0.9, // cao một chút để 3 kịch bản đa dạng hơn
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
    signal: AbortSignal.timeout(40_000),
  });

  if (!res.ok) {
    throw new Error(`LLM lỗi ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  return parseVariants(text);
}

// Bóc mảng JSON ra khỏi câu trả lời và kiểm tra đủ 3 kịch bản, đủ 3 phần
function parseVariants(text: string): ScriptVariant[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("LLM không trả về JSON hợp lệ");

  const raw: unknown = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(raw) || raw.length < 3) throw new Error("LLM trả về thiếu kịch bản");

  return raw.slice(0, 3).map((item) => {
    const v = item as Partial<ScriptVariant>;
    if (!v.hook || !v.body || !v.cta) throw new Error("Kịch bản thiếu phần hook/body/cta");
    return { hook: String(v.hook).trim(), body: String(v.body).trim(), cta: String(v.cta).trim() };
  });
}
