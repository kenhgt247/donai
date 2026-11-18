"use client";
// =====================================================================
// Hàm dùng ở giao diện để xuất video:
//   const paths = await uploadPhotos(files)                    // 1. tải ảnh lên Storage
//   const { jobId } = await requestVideo(projectId, 0, paths)  // 2. đặt dựng (trừ 2 credit)
//   const result = await waitForVideo(jobId, (p) => setProgress(p)) // 3. chờ xong
//   result.videoUrl / result.downloadUrl                       // 4. xem & tải MP4
// =====================================================================
import { createClient } from "@/lib/supabase/client";

const MAX_SIDE = 1600; // thu nhỏ ảnh trước khi tải lên: nhanh hơn, đủ nét cho video 1080×1920

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Không nén được ảnh"))), "image/jpeg", 0.88)
  );
}

export async function uploadPhotos(files: File[]): Promise<string[]> {
  if (files.length < 3 || files.length > 5) throw new Error("Cần từ 3 đến 5 ảnh sản phẩm.");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  return Promise.all(
    files.map(async (file) => {
      const blob = await compressImage(file);
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw new Error(`Tải ảnh "${file.name}" lỗi: ${error.message}`);
      return path;
    })
  );
}

export async function requestVideo(projectId: string, variantIndex: number, photoPaths: string[]) {
  const res = await fetch("/api/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, variantIndex, photoPaths }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Không đặt dựng được video."), { code: data.code });
  return data as { jobId: string; status: string; credits?: number; reused?: boolean };
}

export type VideoResult = { status: "done"; videoUrl: string; downloadUrl: string };

export async function waitForVideo(
  jobId: string,
  onProgress?: (percent: number, status: string) => void,
  signal?: AbortSignal,
  timeoutMs = 10 * 60_000
): Promise<VideoResult> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (signal?.aborted) throw new Error("Đã huỷ");
    const res = await fetch(`/api/video/${jobId}`, { cache: "no-store", signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Không xem được tiến độ video.");
    onProgress?.(data.progress ?? 0, data.status);
    if (data.status === "done") return data as VideoResult;
    if (data.status === "failed") throw new Error(data.error ?? "Dựng video không thành công.");
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Dựng video lâu hơn dự kiến. Bạn quay lại sau ít phút, video sẽ có trong lịch sử.");
}
