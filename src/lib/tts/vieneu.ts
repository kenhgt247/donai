import { Mp3Encoder } from "@breezystack/lamejs";

// Gọi máy chủ VieNeu-TTS (API tương thích OpenAI: POST /v1/audio/speech)
// rồi chuyển âm thanh PCM thô (16-bit, mono) sang MP3 ngay trong Node — không cần ffmpeg.

const SAMPLE_RATE = Number(process.env.VIENEU_SAMPLE_RATE ?? 48000); // v3 Turbo xuất 48 kHz
const MP3_KBPS = 128;
const FRAME = 1152; // số mẫu mỗi khung MP3

export async function synthesizeMp3(text: string, voice: string): Promise<Buffer> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.VIENEU_API_KEY) {
    headers.authorization = `Bearer ${process.env.VIENEU_API_KEY}`;
  }

  const res = await fetch(`${process.env.VIENEU_API_URL}/v1/audio/speech`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: process.env.VIENEU_MODEL ?? "vieneu-v3-turbo",
      voice,
      input: text,
      response_format: "pcm",
    }),
    signal: AbortSignal.timeout(50_000),
  });

  if (!res.ok) {
    throw new Error(`VieNeu-TTS lỗi ${res.status}: ${await res.text()}`);
  }

  const pcm = await res.arrayBuffer(); // gom toàn bộ luồng âm thanh trả về
  if (pcm.byteLength < 1000) throw new Error("VieNeu-TTS trả về âm thanh rỗng");
  return pcmToMp3(pcm);
}

function pcmToMp3(pcm: ArrayBuffer): Buffer {
  const samples = new Int16Array(pcm, 0, Math.floor(pcm.byteLength / 2));
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, MP3_KBPS);
  const chunks: Uint8Array[] = [];

  for (let i = 0; i < samples.length; i += FRAME) {
    const out = encoder.encodeBuffer(samples.subarray(i, i + FRAME));
    if (out.length > 0) chunks.push(new Uint8Array(out));
  }
  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(new Uint8Array(tail));

  return Buffer.concat(chunks);
}
