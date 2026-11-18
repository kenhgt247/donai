"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Coins, Copy, Crown, Loader2, QrCode, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TOPUP_PACKAGES, TOPUP_PREFIX } from "@/lib/pricing";

const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID ?? "";
const ACCOUNT_NO = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO ?? "";
const ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "";

const vnd = (n: number) => n.toLocaleString("vi-VN") + "đ";

export default function BillingClient({ userId, initialCredits, paymentCode }: { userId: string; initialCredits: number; paymentCode: string }) {
  const [selected, setSelected] = useState<number>(1);
  const [credits, setCredits] = useState(initialCredits);
  const [added, setAdded] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const baseline = useRef(initialCredits);

  const pkg = TOPUP_PACKAGES[selected];
  const transferContent = `${TOPUP_PREFIX} ${paymentCode}`;
  const bankReady = BANK_ID && ACCOUNT_NO;
  const qrUrl = bankReady
    ? `https://img.vietqr.io/image/${encodeURIComponent(BANK_ID)}-${encodeURIComponent(ACCOUNT_NO)}-compact2.png?amount=${pkg.amountVnd}&addInfo=${encodeURIComponent(
        transferContent
      )}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : null;

  // Kiểm tra số dư mỗi 5 giây: webhook SePay cộng tiền xong là báo ngay
  useEffect(() => {
    const supabase = createClient();
    const id = setInterval(async () => {
      const { data } = await supabase.from("profiles").select("credits").eq("id", userId).single();
      if (data && data.credits > baseline.current) {
        setAdded(data.credits - baseline.current);
        baseline.current = data.credits;
      }
      if (data) setCredits(data.credits);
    }, 5000);
    return () => clearInterval(id);
  }, [userId]);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* trình duyệt chặn */
    }
    setCopied(label);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-[#0F172A] antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <a href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#0F172A]">
            <ArrowLeft className="h-4 w-4" /> Về trang tạo kịch bản
          </a>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF3EE] px-3 py-1.5 text-sm font-extrabold text-[#C2410C]">
            <Coins className="h-4 w-4" /> {credits} Credits
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Nạp Credit</h1>
        <p className="mt-1 text-slate-600">Quét mã QR bằng app ngân hàng. Credit được cộng tự động sau vài giây, không cần báo lại.</p>

        {added !== null && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-emerald-800 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <div>
              <div className="font-extrabold">Thanh toán thành công! +{added} Credits</div>
              <a href="/dashboard" className="text-sm font-semibold underline">
                Quay lại tạo kịch bản
              </a>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-3 sm:grid-cols-3">
            {TOPUP_PACKAGES.map((p, i) => {
              const on = i === selected;
              const popular = i === 1;
              return (
                <button
                  key={p.amountVnd}
                  onClick={() => setSelected(i)}
                  className={`relative flex flex-col rounded-2xl border-2 bg-white p-5 text-left transition ${
                    on ? "border-[#FF5722] shadow-lg shadow-[#FF5722]/10" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-[#FF5722] px-3 py-1 text-[11px] font-extrabold text-white">
                      <Crown className="h-3 w-3" /> PHỔ BIẾN NHẤT
                    </span>
                  )}
                  <span className="text-sm font-bold text-slate-600">{p.label}</span>
                  <span className="mt-1 text-2xl font-extrabold">{vnd(p.amountVnd)}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm font-extrabold text-[#C2410C]">
                    <Coins className="h-4 w-4" /> {p.credits} Credits
                  </span>
                  <span className="mt-0.5 text-xs text-slate-500">≈ {vnd(Math.round(p.amountVnd / p.credits))}/Credit</span>
                  <span className={`mt-4 rounded-lg py-2 text-center text-sm font-bold ${on ? "bg-[#FF5722] text-white" : "bg-slate-100 text-slate-700"}`}>
                    {on ? "Đã chọn" : "Chọn gói"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 font-bold">
              <QrCode className="h-5 w-5 text-[#FF5722]" /> Quét để thanh toán
            </div>

            {qrUrl ? (
              <img src={qrUrl} alt={`Mã QR chuyển ${vnd(pkg.amountVnd)}`} className="mx-auto mt-4 aspect-square w-full max-w-[260px] rounded-2xl border border-slate-100" />
            ) : (
              <div className="mt-4 flex gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                <TriangleAlert className="h-5 w-5 shrink-0" /> Chưa cấu hình tài khoản ngân hàng (NEXT_PUBLIC_BANK_ID, NEXT_PUBLIC_BANK_ACCOUNT_NO).
              </div>
            )}

            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Số tiền" value={vnd(pkg.amountVnd)} onCopy={() => copy("amount", String(pkg.amountVnd))} copied={copied === "amount"} strong />
              {ACCOUNT_NO && <Row label="Số tài khoản" value={ACCOUNT_NO} onCopy={() => copy("acc", ACCOUNT_NO)} copied={copied === "acc"} />}
              {ACCOUNT_NAME && <Row label="Chủ tài khoản" value={ACCOUNT_NAME} />}
              <Row label="Nội dung" value={transferContent} onCopy={() => copy("content", transferContent)} copied={copied === "content"} strong accent />
            </dl>

            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
              Giữ đúng nội dung <b>{transferContent}</b> để hệ thống nhận ra tài khoản của bạn. Chuyển khác số tiền gói thì được quy đổi theo giá lẻ.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang chờ tiền về...
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  onCopy,
  copied,
  strong,
  accent,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="flex items-center gap-1.5">
        <span className={`${strong ? "font-extrabold" : "font-semibold"} ${accent ? "font-mono text-[#C2410C]" : ""}`}>{value}</span>
        {onCopy && (
          <button onClick={onCopy} aria-label={`Copy ${label}`} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-[#0F172A]">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </dd>
    </div>
  );
}
