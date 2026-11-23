// Gọi máy chủ VieNeu-TTS (API tương thích OpenAI: POST /v1/audio/speech)
// rồi gói âm thanh PCM thô (16-bit, mono) thành file WAV.
//
// Vì sao WAV mà không phải MP3: web chạy trên Cloudflare Workers, gói miễn phí chỉ cho
// 10 ms CPU mỗi lượt. Nén MP3 tốn hàng trăm ms nên sẽ bị ngắt; gói WAV chỉ là thêm
// 44 byte đầu file, gần như không tốn CPU. Trình duyệt và FFmpeg đều đọc WAV bình thường.

const SAMPLE_RATE = Number(process.env.VIENEU_SAMPLE_RATE ?? 48000); // v3 Turbo xuất 48 kHz

export async function synthesizeWav(text: string, voice: string): Promise<Uint8Array> {
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

  const pcm = new Uint8Array(await res.arrayBuffer()); // gom toàn bộ luồng âm thanh trả về
  if (pcm.byteLength < 1000) throw new Error("VieNeu-TTS trả về âm thanh rỗng");
  return pcmToWav(pcm.subarray(0, pcm.byteLength - (pcm.byteLength % 2)));
}

function pcmToWav(pcm: Uint8Array): Uint8Array {
  const channels = 1;
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = SAMPLE_RATE * blockAlign;

  const out = new Uint8Array(44 + pcm.byteLength);
  const view = new DataView(out.buffer);
  const ascii = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) out[offset + i] = s.charCodeAt(i);
  };

  ascii(0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true); // kích thước khối fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  ascii(36, "data");
  view.setUint32(40, pcm.byteLength, true);
  out.set(pcm, 44);

  return out;
}
