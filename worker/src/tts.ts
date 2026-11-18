// Gọi máy chủ VieNeu-TTS (API kiểu OpenAI) → âm thanh PCM → MP3 bằng FFmpeg
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const SAMPLE_RATE = Number(process.env.VIENEU_SAMPLE_RATE ?? 48000);

export async function synthesizeToMp3(text: string, voice: string, pcmFile: string, mp3File: string): Promise<void> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.VIENEU_API_KEY) headers.authorization = `Bearer ${process.env.VIENEU_API_KEY}`;

  const res = await fetch(`${process.env.VIENEU_API_URL}/v1/audio/speech`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: process.env.VIENEU_MODEL ?? "vieneu-v3-turbo",
      voice,
      input: text,
      response_format: "pcm",
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error(`VieNeu-TTS lỗi ${res.status}: ${await res.text()}`);

  const pcm = Buffer.from(await res.arrayBuffer());
  if (pcm.length < 2000) throw new Error("VieNeu-TTS trả về âm thanh rỗng");
  await writeFile(pcmFile, pcm);

  await new Promise<void>((resolve, reject) => {
    const p = spawn("ffmpeg", ["-y", "-v", "error", "-f", "s16le", "-ar", String(SAMPLE_RATE), "-ac", "1", "-i", pcmFile, "-c:a", "libmp3lame", "-b:a", "128k", mp3File]);
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Chuyển MP3 lỗi: ${err}`))));
  });
}
