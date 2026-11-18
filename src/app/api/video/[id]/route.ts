// =====================================================================
// GET /api/video/:id — Xem tiến độ dựng video; xong thì trả link xem + link tải MP4
// Giao diện gọi lại mỗi 3 giây cho tới khi status = "done" hoặc "failed"
// =====================================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });

  // Dùng client của người dùng → RLS tự chặn xem việc của người khác
  const { data: job } = await supabase
    .from("video_jobs")
    .select("id, status, progress, video_path, error_message, refunded, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!job) return NextResponse.json({ error: "Không tìm thấy video." }, { status: 404 });

  if (job.status !== "done" || !job.video_path) {
    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      error: job.status === "failed" ? "Dựng video không thành công. Credit đã được hoàn lại, bạn thử lại nhé." : null,
      refunded: job.refunded,
    });
  }

  const bucket = createAdminClient().storage.from("videos");
  const [play, download] = await Promise.all([
    bucket.createSignedUrl(job.video_path, 60 * 60),
    bucket.createSignedUrl(job.video_path, 60 * 60, { download: `don-ai-video-${job.id.slice(0, 8)}.mp4` }),
  ]);

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: 100,
    videoUrl: play.data?.signedUrl ?? null,
    downloadUrl: download.data?.signedUrl ?? null,
  });
}
