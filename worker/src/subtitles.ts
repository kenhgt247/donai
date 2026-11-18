// =====================================================================
// Tạo file phụ đề .ASS kiểu TikTok cho FFmpeg (libass) vẽ lên video
//  - Thẻ HOOK nền cam ở 3 giây đầu
//  - Phụ đề chạy chữ: mỗi lần hiện 3–4 từ, từ đang đọc chuyển màu cam
//  - Nhãn tên sản phẩm, logo Đơn AI, nút "BẤM GIỎ HÀNG NGAY" ở cuối
// Màu trong ASS viết theo thứ tự &HAABBGGRR (ngược với #RRGGBB)
// =====================================================================

export type SubtitleInput = {
  hook: string;
  body: string;
  cta: string;
  product: string;
  speechSeconds: number; // độ dài giọng đọc thật (ffprobe)
  totalSeconds: number; // độ dài video (giọng đọc + đuôi)
  watermark: boolean;
  width: number;
  height: number;
};

const ORANGE = "&H002257FF"; // #FF5722
const NAVY = "&H002A170F"; // #0F172A
const WHITE = "&H00FFFFFF";
const BLACK = "&H00000000";
const HOOK_END = 3.0;

function ts(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const cs = Math.round((s - Math.floor(s)) * 100);
  const whole = Math.floor(s % 60) + (cs === 100 ? 1 : 0);
  return `${h}:${String(m).padStart(2, "0")}:${String(whole).padStart(2, "0")}.${String(cs === 100 ? 0 : cs).padStart(2, "0")}`;
}

// Chặn ký tự đặc biệt của ASS trong lời thoại
function esc(text: string): string {
  return text.replace(/\\/g, "／").replace(/\{/g, "(").replace(/\}/g, ")").replace(/\r?\n/g, " ");
}

type Word = { text: string; start: number; end: number };

/**
 * Ước lượng thời điểm đọc từng từ: chia đều theo độ dài từ, cộng thêm
 * khoảng nghỉ ở dấu câu, rồi co giãn cho khớp đúng độ dài giọng đọc thật.
 * (Muốn khớp tuyệt đối từng từ: thay bằng forced alignment, vd. WhisperX.)
 */
export function estimateWordTimings(text: string, speechSeconds: number): Word[] {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => 0.6 + w.length * 0.12 + (/[.!?]$/.test(w) ? 0.9 : /[,:;]$/.test(w) ? 0.45 : 0));
  const k = speechSeconds / weights.reduce((a, b) => a + b, 0);
  let t = 0;
  return words.map((w, i) => {
    const start = t;
    t += weights[i] * k;
    return { text: w, start, end: t };
  });
}

function chunkWords(words: Word[]): Word[][] {
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const end = /[.!?]$/.test(w.text) || (/[,:;]$/.test(w.text) && cur.length >= 2) || cur.length >= 4 || i === words.length - 1;
    if (end) {
      chunks.push(cur);
      cur = [];
    }
  });
  return chunks;
}

export function buildAss(input: SubtitleInput): string {
  const { width: W, height: H } = input;
  const font = "Be Vietnam Pro";
  const fullText = `${input.hook} ${input.body} ${input.cta}`;
  const words = estimateWordTimings(fullText, input.speechSeconds);

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,${font},78,${WHITE},${WHITE},${BLACK},&H96000000,-1,0,0,0,100,100,0,0,1,7,4,2,80,80,600,1
Style: Hook,${font},70,${WHITE},${WHITE},${ORANGE},${ORANGE},-1,0,0,0,100,100,0,0,3,26,0,8,110,110,330,1
Style: Cta,${font},50,${NAVY},${NAVY},${WHITE},${WHITE},-1,0,0,0,100,100,1,0,3,28,0,2,80,80,170,1
Style: Label,${font},38,${WHITE},${WHITE},&H70000000,&H70000000,-1,0,0,0,100,100,0,0,3,16,0,7,56,56,92,1
Style: Brand,${font},40,${WHITE},${WHITE},${BLACK},&H64000000,-1,0,0,0,100,100,0,0,1,0,2,9,56,56,96,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const ev: string[] = [];
  const total = input.totalSeconds;
  const line = (layer: number, start: number, end: number, style: string, text: string) =>
    ev.push(`Dialogue: ${layer},${ts(start)},${ts(end)},${style},,0,0,0,,${text}`);

  // Nhãn sản phẩm + logo suốt video
  const label = input.product.length > 30 ? input.product.slice(0, 29) + "…" : input.product;
  line(1, 0, total, "Label", esc(label));
  if (input.watermark) line(1, 0, total, "Brand", `Đơn{\\c${ORANGE}} AI`);

  // Thẻ HOOK 3 giây đầu: hiện ra, nghiêng nhẹ, mờ dần
  line(3, 0, HOOK_END, "Hook", `{\\fad(120,280)\\frz2\\fscx88\\fscy88\\t(0,180,\\fscx100\\fscy100)}${esc(input.hook)}`);

  // Phụ đề chạy chữ (ẩn trong lúc thẻ HOOK hiện để không lặp chữ)
  for (const chunk of chunkWords(words)) {
    chunk.forEach((w, j) => {
      const start = Math.max(w.start, HOOK_END);
      const end = j === chunk.length - 1 ? w.end : chunk[j + 1].start;
      if (end <= start + 0.02) return;
      const pop = j === 0 && w.start >= HOOK_END ? "{\\fscx92\\fscy92\\t(0,120,\\fscx100\\fscy100)}" : "";
      const text = chunk
        .map((x, k) => (k === j ? `{\\c${ORANGE}}${esc(x.text)}{\\c${WHITE}}` : esc(x.text)))
        .join(" ");
      line(2, start, end, "Caption", pop + text);
    });
  }

  // Nút kêu gọi ở 4,5 giây cuối, nảy nhẹ lên xuống
  const ctaStart = Math.max(HOOK_END, total - 4.5);
  let t = ctaStart;
  let up = true;
  while (t < total) {
    const next = Math.min(total, t + 0.45);
    const y1 = H - 170 - (up ? 0 : 14);
    const y2 = H - 170 - (up ? 14 : 0);
    const fade = t === ctaStart ? "\\fad(250,0)" : "";
    line(4, t, next, "Cta", `{${fade}\\an2\\move(${W / 2},${y1},${W / 2},${y2})}BẤM GIỎ HÀNG NGAY  ▼`);
    t = next;
    up = !up;
  }

  return header + ev.join("\n") + "\n";
}
