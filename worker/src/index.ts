// =====================================================================
// Đơn AI — Video Worker
// Chạy liên tục trên VPS (cùng máy với VieNeu-TTS):
//   1. Nhận việc từ bảng video_jobs (hàng đợi trong Supabase)
//   2. Tải ảnh + giọng đọc (chưa có thì gọi VieNeu tạo)
//   3. Dựng MP4 bằng FFmpeg → tải lên Storage → báo xong
//   Lỗi ở bất kỳ bước nào → đánh dấu thất bại + TỰ HOÀN CREDIT
// =====================================================================
import { createClient } from "@supabase/supabase-js";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir, hostname } from "node:os";
import path from "node:path";
import { renderVideo } from "./render.ts";
import { synthesizeToMp3 } from "./tts.ts";

const env = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`Thiếu biến môi trường ${k}`);
  return v;
};

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const WORKER_ID = process.env.WORKER_ID ?? `${hostname()}-${process.pid}`;
const POLL_MS = Number(process.env.POLL_MS ?? 3000);
const FONTS_DIR = process.env.FONTS_DIR ?? "/app/fonts";

type Job = {
  id: string;
  user_id: string;
  project_id: string;
  variant_index: number;
  photo_paths: string[];
  watermark: boolean; // false = khách đã nạp tiền → video sạch, không logo
};

type Variant = { hook: string; body: string; cta: string; audio_path?: string | null };

let stopping = false;
process.on("SIGTERM", () => (stopping = true));
process.on("SIGINT", () => (stopping = true));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const log = (...a: unknown[]) => console.log(new Date().toISOString(), ...a);

async function download(bucket: string, from: string, to: string) {
  const { data, error } = await supabase.storage.from(bucket).download(from);
  if (error || !data) throw new Error(`Không tải được ${bucket}/${from}: ${error?.message}`);
  await writeFile(to, Buffer.from(await data.arrayBuffer()));
}

async function setProgress(jobId: string, progress: number) {
  await supabase.rpc("set_video_job_progress", { p_id: jobId, p_progress: Math.round(progress) });
}

async function processJob(job: Job) {
  const dir = await mkdtemp(path.join(tmpdir(), `video-${job.id}-`));
  try {
    // 1. Lấy kịch bản
    const { data: project, error } = await supabase
      .from("projects")
      .select("id, user_id, title, voice_id, variants")
      .eq("id", job.project_id)
      .single();
    if (error || !project) throw new Error(`Không tìm thấy project: ${error?.message}`);
    if (project.user_id !== job.user_id) throw new Error("Project không thuộc người dùng này");
    const variants = (project.variants ?? []) as Variant[];
    const v = variants[job.variant_index];
    if (!v) throw new Error("Không có kịch bản số " + (job.variant_index + 1));

    // 2. Tải ảnh
    const photos: string[] = [];
    for (const [i, p] of job.photo_paths.entries()) {
      const file = path.join(dir, `photo-${i}${path.extname(p) || ".jpg"}`);
      await download("photos", p, file);
      photos.push(file);
    }
    await setProgress(job.id, 15);

    // 3. Giọng đọc: dùng file có sẵn, chưa có thì tạo bằng VieNeu rồi lưu lại cho lần sau
    // Web lưu giọng đọc dạng .wav, worker lưu .mp3 — giữ đúng đuôi file khi tải về
    const audioFile = path.join(dir, `voice${v.audio_path ? path.extname(v.audio_path) || ".mp3" : ".mp3"}`);
    if (v.audio_path) {
      await download("audio", v.audio_path, audioFile);
    } else {
      await synthesizeToMp3(`${v.hook} ${v.body} ${v.cta}`, project.voice_id ?? "Ngọc Linh", path.join(dir, "voice.pcm"), audioFile);
      const audioPath = `${job.user_id}/${job.project_id}/kich-ban-${job.variant_index + 1}.mp3`;
      const up = await supabase.storage.from("audio").upload(audioPath, await readFile(audioFile), { contentType: "audio/mpeg", upsert: true });
      if (!up.error) {
        variants[job.variant_index] = { ...v, audio_path: audioPath };
        await supabase.from("projects").update({ variants }).eq("id", job.project_id);
      }
    }
    await setProgress(job.id, 30);

    // 4. Dựng video
    const outFile = path.join(dir, "video.mp4");
    let lastReported = 30;
    await renderVideo({
      photos,
      audio: audioFile,
      hook: v.hook,
      body: v.body,
      cta: v.cta,
      product: project.title ?? "",
      outFile,
      workDir: dir,
      fontsDir: FONTS_DIR,
      watermark: job.watermark !== false,
      onProgress: (r) => {
        const pct = 30 + r * 62;
        if (pct - lastReported >= 8) {
          lastReported = pct;
          void setProgress(job.id, pct);
        }
      },
    });

    // 5. Tải video lên Storage
    const videoPath = `${job.user_id}/${job.id}.mp4`;
    const { error: upErr } = await supabase.storage
      .from("videos")
      .upload(videoPath, await readFile(outFile), { contentType: "video/mp4", upsert: true });
    if (upErr) throw new Error(`Upload video lỗi: ${upErr.message}`);

    const { error: doneErr } = await supabase.rpc("complete_video_job", { p_id: job.id, p_video_path: videoPath });
    if (doneErr) throw new Error(`Không cập nhật được trạng thái: ${doneErr.message}`);
    log(`✓ Xong job ${job.id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(`✗ Job ${job.id} lỗi: ${message}`);
    // Hàm này đánh dấu thất bại VÀ hoàn credit (chỉ hoàn 1 lần)
    await supabase.rpc("fail_video_job", { p_id: job.id, p_error: message.slice(0, 1000) });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function main() {
  log(`Video worker ${WORKER_ID} bắt đầu, kiểm tra hàng đợi mỗi ${POLL_MS}ms`);
  let lastSweep = 0;
  while (!stopping) {
    // 5 phút một lần: việc treo quá 3 lần thử → báo lỗi và hoàn credit
    if (Date.now() - lastSweep > 5 * 60_000) {
      lastSweep = Date.now();
      const { data: n } = await supabase.rpc("fail_stuck_video_jobs");
      if (n) log(`Đã hoàn credit cho ${n} việc bị treo`);
    }
    const { data, error } = await supabase.rpc("claim_video_job", { p_worker: WORKER_ID });
    if (error) {
      log("Lỗi nhận việc:", error.message);
      await sleep(POLL_MS * 3);
      continue;
    }
    const job = (Array.isArray(data) ? data[0] : data) as Job | undefined;
    if (!job?.id) {
      await sleep(POLL_MS);
      continue;
    }
    log(`→ Nhận job ${job.id} (${job.photo_paths.length} ảnh)`);
    await processJob(job);
  }
  log("Đã dừng worker.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
