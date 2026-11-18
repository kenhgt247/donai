// =====================================================================
// POST /api/video — Đặt dựng 1 video review từ ảnh sản phẩm
// Body: { projectId, variantIndex (0-2), photoPaths: ["<user_id>/<file>.jpg", ...] }
// Luồng: Đăng nhập → kiểm tra kịch bản & ảnh → khách đã nạp tiền thì video không logo
//        → (dùng lại video cũ nếu trùng)
//        → trừ 2 credit → thêm vào hàng đợi → worker trên VPS sẽ dựng
// =====================================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const REVIEW_COST = 2;
const MAX_ACTIVE_JOBS = 3; // mỗi người tối đa 3 video đang chờ/đang dựng

const err = (message: string, status: number, code: string) => NextResponse.json({ error: message, code }, { status });

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("Bạn cần đăng nhập.", 401, "UNAUTHORIZED");

  const body = (await req.json().catch(() => null)) as {
    projectId?: unknown;
    variantIndex?: unknown;
    photoPaths?: unknown;
  } | null;

  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  const variantIndex = Number(body?.variantIndex);
  const photoPaths = Array.isArray(body?.photoPaths) ? (body!.photoPaths as unknown[]).filter((p): p is string => typeof p === "string") : [];

  if (!/^[0-9a-f-]{36}$/i.test(projectId) || !Number.isInteger(variantIndex) || variantIndex < 0 || variantIndex > 2) {
    return err("Thiếu thông tin kịch bản.", 400, "INVALID_INPUT");
  }
  if (photoPaths.length < 3 || photoPaths.length > 5) {
    return err("Cần từ 3 đến 5 ảnh sản phẩm.", 400, "INVALID_PHOTOS");
  }
  // Ảnh phải nằm trong thư mục của chính người dùng, không có ký tự lạ
  const safe = photoPaths.every((p) => p.startsWith(`${user.id}/`) && !p.includes("..") && /^[\w\-/.]+$/.test(p));
  if (!safe) return err("Đường dẫn ảnh không hợp lệ.", 400, "INVALID_PHOTOS");

  const admin = createAdminClient();

  // Khách đã từng nạp tiền → video sạch, không chèn logo "Đơn AI"
  const { data: paid } = await admin.rpc("has_paid", { p_user: user.id });
  const watermark = paid !== true;

  // Kịch bản có tồn tại và thuộc người này không?
  const { data: project } = await admin.from("projects").select("id, user_id, variants").eq("id", projectId).single();
  if (!project || project.user_id !== user.id) return err("Không tìm thấy kịch bản.", 404, "NOT_FOUND");
  if (!Array.isArray(project.variants) || !project.variants[variantIndex]) {
    return err("Không tìm thấy kịch bản số " + (variantIndex + 1) + ".", 404, "NOT_FOUND");
  }

  // Cùng kịch bản + cùng bộ ảnh (+ cùng chế độ logo) đã dựng/đang dựng rồi → trả lại việc cũ, KHÔNG trừ thêm credit
  const { data: existing } = await admin
    .from("video_jobs")
    .select("id, status")
    .eq("project_id", projectId)
    .eq("variant_index", variantIndex)
    .eq("watermark", watermark)
    .in("status", ["queued", "processing", "done"])
    .filter("photo_paths", "eq", `{${photoPaths.join(",")}}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ jobId: existing.id, status: existing.status, reused: true });
  }

  // Chống spam: giới hạn số video đang chờ
  const { count } = await admin
    .from("video_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["queued", "processing"]);
  if ((count ?? 0) >= MAX_ACTIVE_JOBS) {
    return err(`Bạn đang có ${count} video chờ dựng. Đợi xong bớt rồi tạo tiếp nhé.`, 429, "TOO_MANY_JOBS");
  }

  // Trừ credit (nguyên tử, không bao giờ âm)
  const { data: creditsLeft, error: spendError } = await admin.rpc("spend_credits", { p_user: user.id, p_amount: REVIEW_COST });
  if (spendError) {
    const insufficient = spendError.message.includes("INSUFFICIENT_CREDITS");
    return insufficient
      ? err(`Cần ${REVIEW_COST} Credits để xuất video. Vui lòng nạp thêm.`, 402, "INSUFFICIENT_CREDITS")
      : err("Không trừ được credit, thử lại sau.", 500, "CREDIT_ERROR");
  }

  const { data: job, error: insertError } = await admin
    .from("video_jobs")
    .insert({
      user_id: user.id,
      project_id: projectId,
      variant_index: variantIndex,
      kind: "review",
      photo_paths: photoPaths,
      credits_charged: REVIEW_COST,
      watermark,
    })
    .select("id, status")
    .single();

  if (insertError || !job) {
    await admin.rpc("refund_credits", { p_user: user.id, p_amount: REVIEW_COST });
    console.error("[video] insert job:", insertError);
    return err("Không tạo được yêu cầu dựng video. Bạn đã được hoàn credit.", 500, "JOB_ERROR");
  }

  return NextResponse.json({ jobId: job.id, status: job.status, credits: creditsLeft as number, watermark }, { status: 202 });
}
