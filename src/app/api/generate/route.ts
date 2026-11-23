// =====================================================================
// API Route: POST /api/generate
// Luồng: Đăng nhập → Kiểm tra credit → Trừ 1 credit → AI viết 3 kịch bản
//        → Đọc giọng kịch bản số 1 (VieNeu-TTS) → Lưu Projects → Trả về giao diện
//
// 🔑 KHÔNG dán API Key trực tiếp vào file này. Mọi key nằm trong file .env.local
//    (xem hướng dẫn ở cuối câu trả lời / file .env.example).
// =====================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // dùng NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
import { createAdminClient } from "@/lib/supabase/admin"; // dùng SUPABASE_SERVICE_ROLE_KEY
import { generateScripts } from "@/lib/ai/llm"; // dùng ANTHROPIC_API_KEY
import { synthesizeWav } from "@/lib/tts/vieneu"; // dùng VIENEU_API_URL + VIENEU_API_KEY
import {
  CREDIT_COST,
  PRODUCT_MAX,
  PRODUCT_MIN,
  TONES,
  VOICES,
  type ToneKey,
  type VoiceKey,
} from "@/lib/options";

export const runtime = "nodejs";
export const maxDuration = 60; // giây — đủ cho 1 lần viết kịch bản + 1 file giọng đọc

const SIGNED_URL_TTL = 60 * 60; // link nghe/tải giọng đọc có hiệu lực 1 giờ

function errorJson(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: Request) {
  // -------------------------------------------------------------------
  // BƯỚC 1a: Kiểm tra đăng nhập
  // -------------------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorJson("Bạn cần đăng nhập để tạo kịch bản.", 401, "UNAUTHORIZED");
  }

  // Kiểm tra dữ liệu gửi lên từ form
  const body = (await req.json().catch(() => null)) as {
    product?: unknown;
    tone?: unknown;
    voice?: unknown;
  } | null;

  const product = typeof body?.product === "string" ? body.product.trim() : "";
  const tone = body?.tone as ToneKey;
  const voice = body?.voice as VoiceKey;

  if (product.length < PRODUCT_MIN || product.length > PRODUCT_MAX) {
    return errorJson(
      `Mô tả sản phẩm cần từ ${PRODUCT_MIN} đến ${PRODUCT_MAX} ký tự.`,
      400,
      "INVALID_INPUT"
    );
  }
  if (typeof tone !== "string" || !(tone in TONES) || typeof voice !== "string" || !(voice in VOICES)) {
    return errorJson("Giọng văn hoặc giọng đọc không hợp lệ.", 400, "INVALID_INPUT");
  }

  const admin = createAdminClient();

  // -------------------------------------------------------------------
  // BƯỚC 1b: Kiểm tra số dư credit
  // -------------------------------------------------------------------
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return errorJson("Không tìm thấy tài khoản.", 404, "PROFILE_NOT_FOUND");
  }

  if (profile.credits < CREDIT_COST) {
    return errorJson(
      "Bạn đã hết lượt tạo kịch bản. Vui lòng nạp thêm Credit để tiếp tục.",
      402, // 402 = Payment Required → giao diện hiện nút "Nạp thêm Credit"
      "INSUFFICIENT_CREDITS"
    );
  }

  // -------------------------------------------------------------------
  // BƯỚC 2: Trừ 1 credit
  // Dùng hàm spend_credits trong database: trừ và kiểm tra trong CÙNG một lệnh,
  // nên nếu user bấm nút liên tục 2 lần thì cũng không bị trừ âm.
  // -------------------------------------------------------------------
  const { data: creditsLeft, error: spendError } = await admin.rpc("spend_credits", {
    p_user: user.id,
    p_amount: CREDIT_COST,
  });

  if (spendError) {
    if (spendError.message.includes("INSUFFICIENT_CREDITS")) {
      return errorJson(
        "Bạn đã hết lượt tạo kịch bản. Vui lòng nạp thêm Credit để tiếp tục.",
        402,
        "INSUFFICIENT_CREDITS"
      );
    }
    console.error("[generate] spend_credits:", spendError);
    return errorJson("Không trừ được credit, vui lòng thử lại.", 500, "CREDIT_ERROR");
  }

  // Từ đây trở đi, nếu có lỗi → HOÀN credit cho người dùng
  const projectId = crypto.randomUUID();
  let uploadedPath: string | null = null;

  try {
    // -----------------------------------------------------------------
    // BƯỚC 3: Gọi LLM viết 3 kịch bản (JSON)
    // -----------------------------------------------------------------
    const scripts = await generateScripts({ product, tone });

    // -----------------------------------------------------------------
    // BƯỚC 4: Đọc giọng kịch bản số 1 → WAV → lưu vào Supabase Storage
    // -----------------------------------------------------------------
    const first = scripts[0];
    const voiceName = VOICES[voice].vieneuVoice;
    const wav = await synthesizeWav(`${first.hook} ${first.body} ${first.cta}`, voiceName);

    const audioPath = `${user.id}/${projectId}/kich-ban-1.wav`;
    const { error: uploadError } = await admin.storage
      .from("audio")
      .upload(audioPath, wav, { contentType: "audio/wav", upsert: true });
    if (uploadError) throw new Error(`Upload audio lỗi: ${uploadError.message}`);
    uploadedPath = audioPath;

    // Link nghe thử + link tải về (bucket là private nên phải dùng link có chữ ký)
    const bucket = admin.storage.from("audio");
    const [play, download] = await Promise.all([
      bucket.createSignedUrl(audioPath, SIGNED_URL_TTL),
      bucket.createSignedUrl(audioPath, SIGNED_URL_TTL, { download: "kich-ban-1.wav" }),
    ]);

    // -----------------------------------------------------------------
    // BƯỚC 5: Lưu toàn bộ kết quả vào bảng projects
    // -----------------------------------------------------------------
    const { error: insertError } = await admin.from("projects").insert({
      id: projectId,
      user_id: user.id,
      title: product.slice(0, 80),
      platform: "tiktok",
      product_info: { raw: product },
      tone,
      tts_provider: "vieneu",
      voice_id: voiceName,
      variants: scripts.map((s, i) => ({ ...s, audio_path: i === 0 ? audioPath : null })),
      script: `${first.hook}\n\n${first.body}\n\n${first.cta}`, // kịch bản chính (số 1)
      audio_path: audioPath,
      credits_used: CREDIT_COST,
      status: "audio_ready",
    });
    if (insertError) throw new Error(`Lưu project lỗi: ${insertError.message}`);

    // Trả dữ liệu về giao diện
    return NextResponse.json({
      projectId,
      credits: creditsLeft as number,
      variants: scripts.map((s, i) => ({
        ...s,
        audioUrl: i === 0 ? play.data?.signedUrl ?? null : null,
        downloadUrl: i === 0 ? download.data?.signedUrl ?? null : null,
      })),
    });
  } catch (err) {
    // Lỗi ở bước 3/4/5 → hoàn credit + xoá file đã upload (nếu có)
    console.error("[generate]", err);
    await admin.rpc("refund_credits", { p_user: user.id, p_amount: CREDIT_COST });
    if (uploadedPath) await admin.storage.from("audio").remove([uploadedPath]);

    return errorJson(
      "Hệ thống đang bận nên chưa tạo được kịch bản. Bạn đã được hoàn lại credit, hãy thử lại sau ít phút.",
      500,
      "GENERATION_FAILED"
    );
  }
}
