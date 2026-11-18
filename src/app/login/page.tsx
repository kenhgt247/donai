"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Đăng nhập bằng link gửi qua email (không cần mật khẩu)
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "link") {
      setError("Link đăng nhập đã hết hạn hoặc không hợp lệ. Bạn nhập email để nhận link mới nhé.");
    }
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Email chưa đúng định dạng.");
      return;
    }
    setStatus("sending");
    setError(null);
    const next = new URLSearchParams(window.location.search).get("next") ?? "/dashboard";
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setStatus("idle");
      setError("Chưa gửi được email: " + error.message);
      return;
    }
    setStatus("sent");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 font-sans text-[#0F172A] antialiased">
      <div className="w-full max-w-md">
        <a href="/" className="mx-auto mb-8 flex w-fit items-center gap-2.5">
          <img src="/icon.svg" alt="" className="h-10 w-10" />
          <span className="text-2xl font-extrabold tracking-tight">
            Đơn<span className="text-[#FF5722]"> AI</span>
          </span>
        </a>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
          {status === "sent" ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF3EE] text-[#C2410C]">
                <MailCheck className="h-7 w-7" />
              </span>
              <h1 className="mt-4 text-xl font-extrabold">Kiểm tra hộp thư của bạn</h1>
              <p className="mt-2 text-sm text-slate-600">
                Đơn AI đã gửi link đăng nhập tới <b>{email}</b>. Bấm vào link trong email là vào được ngay. Không thấy thì xem thư mục Spam/Quảng cáo.
              </p>
              <button onClick={() => setStatus("idle")} className="mt-5 text-sm font-bold text-[#C2410C] hover:underline">
                Dùng email khác
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h1 className="text-xl font-extrabold">Đăng nhập / Đăng ký</h1>
              <p className="mt-1 text-sm text-slate-600">Nhập email, chúng tôi gửi link đăng nhập. Tài khoản mới được tặng 5 Credits.</p>
              <label htmlFor="email" className="mt-6 block text-sm font-bold">
                Email
              </label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@gmail.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 font-medium outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#FF5722] focus:bg-white focus:ring-4 focus:ring-[#FF5722]/15"
                />
              </div>
              {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF5722] py-3.5 text-[17px] font-extrabold text-white shadow-lg shadow-[#FF5722]/30 transition hover:bg-[#E64A19] disabled:opacity-60"
              >
                {status === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {status === "sending" ? "Đang gửi..." : "Gửi link đăng nhập"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
