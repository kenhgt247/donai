// =====================================================================
// Dựng video review 9:16 bằng FFmpeg
// Ảnh sản phẩm (lia máy chậm + chuyển cảnh) + giọng đọc + phụ đề .ASS
// =====================================================================
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { buildAss } from "./subtitles.ts";

export type RenderInput = {
  photos: string[]; // 3–5 file ảnh trên đĩa
  audio: string; // file giọng đọc (mp3/wav)
  hook: string;
  body: string;
  cta: string;
  product: string;
  outFile: string;
  workDir: string;
  fontsDir?: string; // thư mục chứa Be Vietnam Pro .ttf
  watermark?: boolean;
  onProgress?: (ratio: number) => void;
};

const W = 1080;
const H = 1920;
const FPS = 30;
const FADE = 0.5; // giây chuyển cảnh
const TAIL = 0.8; // giữ hình thêm sau khi đọc xong
const OVER = 1.15; // phóng ảnh to hơn khung 15% để có chỗ lia máy
const TRANSITIONS = ["fade", "smoothleft", "fadeblack", "smoothup", "circleopen"];

function run(cmd: string, args: string[], onStdout?: (s: string) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => {
      const s = d.toString();
      out += s;
      onStdout?.(s);
    });
    p.stderr.on("data", (d) => {
      err += d.toString();
      if (err.length > 20000) err = err.slice(-20000);
    });
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} lỗi (mã ${code}): ${err.slice(-1500)}`))));
  });
}

export async function probeDuration(file: string): Promise<number> {
  const out = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  const d = parseFloat(out.trim());
  if (!Number.isFinite(d) || d <= 0) throw new Error(`Không đọc được độ dài file ${file}`);
  return d;
}

// Hướng lia máy cho từng ảnh: trái→phải, phải→trái, trên→dưới, dưới→trên
function panExpr(i: number, seg: number): { x: string; y: string } {
  const p = `min(t/${seg.toFixed(3)},1)`;
  switch (i % 4) {
    case 0:
      return { x: `(iw-ow)*${p}`, y: "(ih-oh)/2" };
    case 1:
      return { x: `(iw-ow)*(1-${p})`, y: "(ih-oh)/2" };
    case 2:
      return { x: "(iw-ow)/2", y: `(ih-oh)*${p}` };
    default:
      return { x: "(iw-ow)/2", y: `(ih-oh)*(1-${p})` };
  }
}

export async function renderVideo(input: RenderInput): Promise<{ seconds: number }> {
  const n = input.photos.length;
  if (n < 1) throw new Error("Cần ít nhất 1 ảnh");

  const speech = await probeDuration(input.audio);
  const total = speech + TAIL;
  // Mỗi ảnh dài seg giây; các đoạn chồng lên nhau FADE giây khi chuyển cảnh
  const seg = (total + (n - 1) * FADE) / n;

  const assFile = path.join(input.workDir, "subs.ass");
  await writeFile(
    assFile,
    buildAss({
      hook: input.hook,
      body: input.body,
      cta: input.cta,
      product: input.product,
      speechSeconds: speech,
      totalSeconds: total,
      watermark: input.watermark ?? true,
      width: W,
      height: H,
    }),
    "utf8"
  );

  // Lớp phủ tối dần ở trên/dưới (vẽ 1 lần) để chữ luôn dễ đọc
  const gradFile = path.join(input.workDir, "gradient.png");
  await run("ffmpeg", [
    "-y", "-v", "error", "-f", "lavfi", "-i", `color=black:s=${W}x${H}`, "-frames:v", "1",
    "-vf", `format=rgba,geq=r='0':g='0':b='0':a='max(150*max(0,1-Y/380),205*min(max((Y-${H - 980})/920,0),1))'`,
    gradFile,
  ]);

  const args: string[] = ["-y", "-hide_banner", "-nostats", "-progress", "pipe:1"];
  input.photos.forEach((p) => args.push("-loop", "1", "-framerate", String(FPS), "-t", seg.toFixed(3), "-i", p));
  args.push("-loop", "1", "-framerate", String(FPS), "-t", total.toFixed(3), "-i", gradFile);
  args.push("-i", input.audio);

  const bw = Math.round((W * OVER) / 2) * 2;
  const bh = Math.round((H * OVER) / 2) * 2;
  const f: string[] = [];
  input.photos.forEach((_, i) => {
    const { x, y } = panExpr(i, seg);
    f.push(
      `[${i}:v]scale=${bw}:${bh}:force_original_aspect_ratio=increase:flags=lanczos,crop=${bw}:${bh},` +
        `crop=${W}:${H}:x='${x}':y='${y}',setsar=1,fps=${FPS},format=yuv420p[v${i}]`
    );
  });

  let last = "v0";
  for (let k = 1; k < n; k++) {
    const out = `x${k}`;
    const offset = (k * (seg - FADE)).toFixed(3);
    f.push(`[${last}][v${k}]xfade=transition=${TRANSITIONS[(k - 1) % TRANSITIONS.length]}:duration=${FADE}:offset=${offset}[${out}]`);
    last = out;
  }

  // Lớp tối trên/dưới cho chữ dễ đọc + thanh tiến trình + phụ đề
  const esc = (s: string) => s.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
  const assOpt = `ass='${esc(assFile)}'` + (input.fontsDir ? `:fontsdir='${esc(input.fontsDir)}'` : "");
  f.push(
    `[${last}][${n}:v]overlay=format=auto:shortest=1,` +
      `drawbox=x=48:y=44:w=iw-96:h=8:color=white@0.35:t=fill,` +
      `drawbox=x=48:y=44:w='(iw-96)*min(t/${total.toFixed(3)},1)':h=8:color=white@0.95:t=fill,` +
      `${assOpt},format=yuv420p[vout]`
  );

  args.push(
    "-filter_complex",
    f.join(";"),
    "-map",
    "[vout]",
    "-map",
    `${n + 1}:a`,
    "-af",
    "apad",
    "-t",
    total.toFixed(3),
    "-r",
    String(FPS),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    input.outFile
  );

  await run("ffmpeg", args, (chunk) => {
    const m = /out_time_us=(\d+)/.exec(chunk);
    if (m && input.onProgress) input.onProgress(Math.min(1, Number(m[1]) / 1e6 / total));
  });

  return { seconds: total };
}
