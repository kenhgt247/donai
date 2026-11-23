"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BadgeCheck,
  Clapperboard,
  Coins,
  Flame,
  Laugh,
  Loader2,
  Mic,
  Plus,
  Sparkles,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import {
  CREDIT_COST,
  PRODUCT_MAX,
  PRODUCT_MIN,
  TONES,
  VOICES,
  type ToneKey,
  type VoiceKey,
} from "@/lib/options";
import { ScriptCard, ScriptCardSkeleton, type ScriptResult } from "./script-card";

const TONE_ICONS: Record<ToneKey, LucideIcon> = {
  trend: Laugh,
  expert: BadgeCheck,
  urgent: Flame,
};

export default function DashboardClient({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [product, setProduct] = useState("");
  const [tone, setTone] = useState<ToneKey>("trend");
  const [voice, setVoice] = useState<VoiceKey>("north_female");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScriptResult[]>([]);
  const resultsRef = useRef<HTMLElement>(null);

  const productLength = product.trim().length;
  const outOfCredits = credits < CREDIT_COST;
  const canSubmit = productLength >= PRODUCT_MIN && !loading && !outOfCredits;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResults([]);
    // Trên điện thoại: cuộn xuống khu vực kết quả để thấy trạng thái đang tạo
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: product.trim(), tone, voice }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Có lỗi xảy ra, vui lòng thử lại.");

      setResults(data.variants);
      setCredits(data.credits);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===================== HEADER ===================== */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-sm">
              <Clapperboard className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight text-slate-900 sm:block">
              Đơn AI
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                outOfCredits ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
              }`}
            >
              <Coins className="h-4 w-4" />
              {outOfCredits ? "Hết lượt" : `Còn ${credits} lượt`}
            </div>
            <Link
              href="/billing"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nạp thêm Credit</span>
              <span className="sm:hidden">Nạp</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ===================== 2 CỘT ===================== */}
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[420px_1fr] lg:py-8">
        {/* ---------- CỘT TRÁI: NHẬP LIỆU ---------- */}
        <section className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
          <h1 className="text-xl font-bold text-slate-900">Tạo video bán hàng</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dán thông tin sản phẩm, AI viết 3 kịch bản và đọc sẵn giọng cho bạn.
          </p>

          {/* 1. Sản phẩm */}
          <div className="mt-6">
            <StepLabel step={1} text="Sản phẩm của bạn" />
            <textarea
              value={product}
              onChange={(e) => setProduct(e.target.value.slice(0, PRODUCT_MAX))}
              rows={6}
              placeholder={
                "Nhập tên sản phẩm hoặc dán mô tả từ Shopee/TikTok.\nVí dụ: Quạt mini cầm tay 3 tốc độ, pin 8 tiếng, sạc Type-C, giá 129k..."
              }
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>{productLength > 0 && productLength < PRODUCT_MIN ? `Nhập thêm ít nhất ${PRODUCT_MIN - productLength} ký tự` : ""}</span>
              <span>
                {product.length}/{PRODUCT_MAX}
              </span>
            </div>
          </div>

          {/* 2. Giọng văn */}
          <div className="mt-5">
            <StepLabel step={2} text="Giọng văn" />
            <div className="grid gap-2">
              {(Object.keys(TONES) as ToneKey[]).map((key) => {
                const Icon = TONE_ICONS[key];
                return (
                  <OptionButton
                    key={key}
                    selected={tone === key}
                    onClick={() => setTone(key)}
                    icon={<Icon className="h-5 w-5" />}
                    title={TONES[key].label}
                    desc={TONES[key].desc}
                  />
                );
              })}
            </div>
          </div>

          {/* 3. Giọng đọc */}
          <div className="mt-5">
            <StepLabel step={3} text="Giọng đọc AI" />
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(VOICES) as VoiceKey[]).map((key) => {
                const selected = voice === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setVoice(key)}
                    aria-pressed={selected}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition ${
                      selected
                        ? "border-orange-400 bg-orange-50 ring-2 ring-orange-200"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Mic className={`h-5 w-5 ${selected ? "text-orange-600" : "text-slate-400"}`} />
                    <span className="text-xs font-semibold text-slate-900">{VOICES[key].label}</span>
                    <span className="text-[11px] leading-tight text-slate-500">{VOICES[key].desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Nút tạo */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canSubmit}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang tạo kịch bản & giọng đọc...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                Tạo 3 Kịch Bản & Giọng Đọc (Tốn {CREDIT_COST} Credit)
              </>
            )}
          </button>

          {outOfCredits && (
            <p className="mt-3 text-center text-sm text-red-600">
              Bạn đã hết lượt.{" "}
              <Link href="/billing" className="font-semibold underline">
                Nạp thêm Credit
              </Link>{" "}
              để tiếp tục.
            </p>
          )}
        </section>

        {/* ---------- CỘT PHẢI: KẾT QUẢ ---------- */}
        <section ref={resultsRef} className="scroll-mt-20">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Kết quả</h2>
            {results.length > 0 && (
              <span className="text-sm text-slate-500">3 kịch bản · giọng đọc cho kịch bản 1 · link tải có hạn 1 giờ</span>
            )}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI đang viết và thu âm, thường mất 20–40 giây...
              </p>
              {[0, 1, 2].map((i) => (
                <ScriptCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((script, i) => (
                <ScriptCard key={i} index={i} script={script} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
      </main>
    </div>
  );
}

/* ===================== Thành phần phụ ===================== */

function StepLabel({ step, text }: { step: number; text: string }) {
  return (
    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
        {step}
      </span>
      {text}
    </label>
  );
}

function OptionButton({
  selected,
  onClick,
  icon,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? "border-orange-400 bg-orange-50 ring-2 ring-orange-200"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span className={selected ? "text-orange-600" : "text-slate-400"}>{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500">{desc}</span>
      </span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-500">
        <Sparkles className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900">Chưa có kịch bản nào</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Nhập thông tin sản phẩm bên trái và bấm nút tạo. Bạn sẽ nhận 3 kịch bản, mỗi kịch bản có sẵn
        file giọng đọc để ghép vào video.
      </p>
    </div>
  );
}
