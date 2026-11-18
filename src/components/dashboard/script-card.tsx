"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Download, MessageSquareText, MousePointerClick, Zap } from "lucide-react";

export type ScriptResult = {
  hook: string;
  body: string;
  cta: string;
  audioUrl: string | null;
  downloadUrl: string | null;
};

export function ScriptCard({ index, script }: { index: number; script: ScriptResult }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = `${script.hook}\n\n${script.body}\n\n${script.cta}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Trình duyệt chặn clipboard — bỏ qua
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Đầu thẻ */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
            {index + 1}
          </span>
          Kịch bản {index + 1}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            copied
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Đã copy" : "Copy chữ"}
        </button>
      </div>

      {/* Nội dung */}
      <div className="space-y-4 px-5 py-4">
        <Section
          icon={<Zap className="h-4 w-4" />}
          label="Mở đầu · giữ chân 3 giây"
          tone="amber"
          text={script.hook}
          emphasize
        />
        <Section
          icon={<MessageSquareText className="h-4 w-4" />}
          label="Nội dung chính"
          tone="sky"
          text={script.body}
        />
        <Section
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Kêu gọi hành động"
          tone="rose"
          text={script.cta}
        />
      </div>

      {/* Âm thanh */}
      <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
        {script.audioUrl ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <audio controls preload="none" src={script.audioUrl} className="h-10 w-full" />
            {script.downloadUrl && (
              <a
                href={script.downloadUrl}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                <Download className="h-4 w-4" />
                Tải MP3
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Bản hiện tại chỉ tạo giọng đọc cho kịch bản số 1. Bạn vẫn copy được chữ để tự thu âm.</p>
        )}
      </div>
    </article>
  );
}

const TONE_STYLES = {
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
  rose: "bg-rose-50 text-rose-700",
} as const;

function Section({
  icon,
  label,
  tone,
  text,
  emphasize = false,
}: {
  icon: ReactNode;
  label: string;
  tone: keyof typeof TONE_STYLES;
  text: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <span
        className={`mb-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${TONE_STYLES[tone]}`}
      >
        {icon}
        {label}
      </span>
      <p
        className={`whitespace-pre-line leading-relaxed text-slate-700 ${
          emphasize ? "text-base font-semibold text-slate-900" : "text-sm"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

export function ScriptCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 h-5 w-32 rounded bg-slate-200" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
        <div className="h-4 w-4/6 rounded bg-slate-200" />
      </div>
      <div className="mt-5 h-10 w-full rounded-lg bg-slate-100" />
    </div>
  );
}
