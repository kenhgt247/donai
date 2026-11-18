"use client";

/* =====================================================================
   ĐƠN AI — Trang chủ (app/page.tsx)
   Next.js App Router · Tailwind CSS · lucide-react
   Slogan: "Biến mọi sản phẩm thành kịch bản bão đơn trong 60 giây"
   Màu thương hiệu: Cam #FF5722 · Xanh đen #0F172A · Trắng #FFFFFF
   ===================================================================== */

import { useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Captions,
  CircleAlert,
  Clapperboard,
  Download,
  Film,
  ImagePlus,
  Volume2,
  VolumeX,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  Copy,
  Crown,
  Flame,
  Laugh,
  Lightbulb,
  Loader2,
  Menu,
  Mic,
  MousePointerClick,
  Pause,
  PenLine,
  Play,
  ShieldCheck,
  Sparkles,
  Timer,
  Wallet,
  Wand2,
  X,
  Zap,
} from "lucide-react";

// TODO: thay bằng thông tin thật của bạn
const SIGNUP_URL = "/login"; // trang đăng ký / đăng nhập
const SUPPORT_EMAIL = "hotro@donai.vn";
const SUPPORT_PHONE = "0900 000 000";

/* =====================================================================
   LOGO (SVG nhúng trực tiếp)
   ===================================================================== */
function LogoMark({ className = "h-9 w-9", inverted = false }: { className?: string; inverted?: boolean }) {
  const bg = inverted ? "#FFFFFF" : "#0F172A";
  const fg = inverted ? "#0F172A" : "#FFFFFF";
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Đơn AI">
      <rect width="48" height="48" rx="12" fill={bg} />
      <path d="M18.5 18v-2.6a5.5 5.5 0 0 1 11 0V18" fill="none" stroke={fg} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M12.6 18h22.8l-1.9 18.6a3.2 3.2 0 0 1-3.2 2.9H17.7a3.2 3.2 0 0 1-3.2-2.9Z" fill={fg} />
      <path d="M26.4 21.2 19.6 30.6h4.9l-2.2 7.6 7.1-10.2h-4.8l1.8-6.8Z" fill="#FF5722" />
      <circle cx="38" cy="10.5" r="3.2" fill="#FF5722" />
    </svg>
  );
}

function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <a href="#" className="flex items-center gap-2.5" aria-label="Đơn AI - Trang chủ">
      <LogoMark inverted={inverted} />
      <span className={`text-[22px] font-extrabold tracking-tight ${inverted ? "text-white" : "text-[#0F172A]"}`}>
        Đơn<span className="text-[#FF5722]"> AI</span>
      </span>
    </a>
  );
}

/* =====================================================================
   DỮ LIỆU
   ===================================================================== */
const NAV = [
  { href: "#tinh-nang", label: "Tính năng" },
  { href: "#trai-nghiem", label: "Trải nghiệm" },
  { href: "#bang-gia", label: "Bảng giá" },
  { href: "#hoi-dap", label: "Hỏi đáp" },
];

type StyleId = "trend" | "expert" | "urgent";
type VoiceId = "north" | "south" | "male";

const STYLES: { id: StyleId; label: string; icon: typeof Laugh }[] = [
  { id: "trend", label: "Bắt trend hài hước", icon: Laugh },
  { id: "expert", label: "Chuyên gia đánh giá", icon: BadgeCheck },
  { id: "urgent", label: "Thúc giục chốt đơn", icon: Flame },
];

const VOICES: { id: VoiceId; label: string; rate: number; pitch: number }[] = [
  { id: "north", label: "Nữ miền Bắc", rate: 1.05, pitch: 1.1 },
  { id: "south", label: "Nữ miền Nam", rate: 1.0, pitch: 1.2 },
  { id: "male", label: "Nam trầm ấm", rate: 0.95, pitch: 0.75 },
];

const PLANS = [
  {
    id: "trai-nghiem",
    name: "Gói Trải Nghiệm",
    price: 49000,
    credits: 15,
    desc: "Cho shop mới bắt đầu làm video",
    features: ["15 Credits ≈ 15 lần tạo kịch bản", "Hoặc 7 video review từ ảnh", "Giọng đọc AI cho mọi kịch bản", "Credit không hết hạn"],
  },
  {
    id: "chu-shop",
    name: "Gói Chủ Shop",
    price: 149000,
    credits: 50,
    popular: true,
    desc: "Lên video đều mỗi ngày",
    features: ["50 Credits ≈ 25 video review từ ảnh", "Phụ đề chạy chữ kiểu TikTok", "Lưu lịch sử kịch bản & video", "Rẻ hơn 9% mỗi Credit", "Credit không hết hạn"],
  },
  {
    id: "dai-ly",
    name: "Gói Đại Lý",
    price: 299000,
    credits: 110,
    desc: "Cho đội nhóm & nhiều gian hàng",
    features: ["110 Credits ≈ 55 video review", "Đủ cho 7 video AI người mẫu (Pro)", "Lưu lịch sử kịch bản & video", "Rẻ hơn 17% mỗi Credit", "Hỗ trợ ưu tiên qua Zalo"],
  },
];

const FAQS = [
  {
    q: "Credit là gì? Mỗi lần tạo tốn bao nhiêu?",
    a: "Tạo 3 kịch bản kèm giọng đọc MP3 tốn 1 Credit. Xuất video review 9:16 từ ảnh sản phẩm tốn 2 Credits. Video AI người mẫu (gói Pro) tốn 15 Credits. Credit không có hạn sử dụng.",
  },
  {
    q: "Tôi không biết viết kịch bản, có dùng được không?",
    a: "Được. Bạn chỉ cần nhập tên sản phẩm và vài điểm nổi bật. Đơn AI tự viết câu mở đầu giữ chân 3 giây, nội dung chính và lời kêu gọi chốt đơn.",
  },
  {
    q: "Thanh toán như thế nào?",
    a: "Bạn quét mã QR ngân hàng với nội dung chuyển khoản có sẵn. Hệ thống tự cộng Credit ngay khi ngân hàng báo tiền về, thường chỉ trong vài giây.",
  },
  {
    q: "Kịch bản có bị trùng với shop khác không?",
    a: "Mỗi kịch bản được AI viết riêng theo thông tin sản phẩm bạn nhập, với 3 góc khai thác khác nhau. Bạn có thể chỉnh sửa thoải mái trước khi quay.",
  },
  {
    q: "Tôi cần cài đặt phần mềm gì không?",
    a: "Không. Đơn AI chạy trên trình duyệt, dùng được trên cả điện thoại và máy tính.",
  },
];

const vnd = (n: number) => n.toLocaleString("vi-VN") + "đ";

/* =====================================================================
   BỘ TẠO KỊCH BẢN MẪU (bản demo trên trang chủ — bản thật gọi AI qua /api/generate)
   ===================================================================== */
type Script = { id: string; angle: string; hook: string; body: string; cta: string; seconds: number };
type Make = (p: string, h: [string, string, string]) => Omit<Script, "id" | "angle" | "seconds">;

const DEFAULT_HL: [string, string, string] = ["chất lượng vượt xa mong đợi", "thiết kế gọn gàng, dùng cực tiện", "giá lại hợp lý bất ngờ"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lowerFirst = (s: string) => (s === s.toUpperCase() ? s : s.charAt(0).toLowerCase() + s.slice(1));

function parseHighlights(text: string): [string, string, string] {
  const items = text
    .split(/[\n,;•]+/)
    .map((s) => s.replace(/^[\s\-–*+.]+|[\s.]+$/g, ""))
    .filter((s) => s.length > 1)
    .map(lowerFirst);
  for (const d of DEFAULT_HL) if (items.length < 3) items.push(d);
  return [items[0], items[1], items[2]];
}

const TEMPLATES: Record<StyleId, { angle: string; make: Make }[]> = {
  trend: [
    {
      angle: "Phá định kiến",
      make: (P, [a, b, c]) => ({
        hook: `Ai bảo tiền nào của nấy? Để ${P} cho bạn tỉnh ngủ liền nè!`,
        body: `Thú thật lúc đầu mình cũng nghi lắm. Nhưng cầm ${P} lên là thấy liền: ${a}. Chưa hết đâu, ${b}, mà ${c} nữa chứ. Đứa bạn thân mượn xài thử xong nhất quyết không trả, giờ mình phải mua thêm cái thứ hai.`,
        cta: `Bấm ngay giỏ hàng vàng, mua một cái cho mình, thêm một cái cho đứa hay mượn đồ!`,
      }),
    },
    {
      angle: "POV trước – sau",
      make: (P, [a, b, c]) => ({
        hook: `POV: bạn vừa phát hiện ra ${P} và cuộc đời bỗng dễ thở hơn hẳn.`,
        body: `Trước đây thì loay hoay, bực bội, than trời. Bây giờ thì sao? ${cap(a)}. Ủa rồi ${b} nữa hả? Còn ${c} luôn? Ai làm ra món này chắc hiểu mình hơn cả người yêu cũ.`,
        cta: `Giỏ hàng vàng ngay bên dưới, bấm lẹ trước khi đứa bạn thân giành mất deal nha!`,
      }),
    },
    {
      angle: "Chân ái người lười",
      make: (P, [a, b, c]) => ({
        hook: `Đừng lướt qua! Không biết món này là thiệt thòi lắm đó.`,
        body: `Giới thiệu ${P}, chân ái của những người lười mà vẫn muốn sống chất. ${cap(a)}, xong. ${cap(b)}, xong luôn. ${cap(c)}, khỏi bàn. Dùng rồi mới thấy mấy năm qua mình sống khổ không cần thiết.`,
        cta: `Bấm vào giỏ hàng vàng, chốt đơn liền tay, mai mốt cảm ơn mình sau nha!`,
      }),
    },
  ],
  expert: [
    {
      angle: "Review sau 2 tuần",
      make: (P, [a, b, c]) => ({
        hook: `Mình đã dùng thử ${P} suốt hai tuần, và đây là đánh giá thật lòng.`,
        body: `Điểm mình đánh giá cao nhất là ${a}. Tiếp theo, ${b}, điều mà nhiều sản phẩm cùng phân khúc chưa làm tốt. Ngoài ra, ${c} cũng là một điểm cộng lớn. Nếu khắt khe thì bao bì hơi đơn giản, nhưng hoàn toàn chấp nhận được.`,
        cta: `Nếu bạn đang cân nhắc, sản phẩm mình để ở giỏ hàng vàng bên dưới, xem đánh giá rồi đặt thử nhé.`,
      }),
    },
    {
      angle: "Checklist 3 điểm",
      make: (P, [a, b, c]) => ({
        hook: `Ba điều cần kiểm tra trước khi mua ${P}, điều thứ ba ít ai để ý.`,
        body: `Thứ nhất, ${a}, yếu tố quyết định trải nghiệm hằng ngày. Thứ hai, ${b}, giúp bạn dùng lâu dài mà không phát sinh chi phí. Thứ ba, ${c}, chi tiết nhỏ nhưng tạo khác biệt lớn. Sản phẩm này đáp ứng đủ cả ba.`,
        cta: `Bấm vào giỏ hàng vàng để xem thông số chi tiết và chính sách đổi trả trước khi quyết định.`,
      }),
    },
    {
      angle: "So với hàng trôi nổi",
      make: (P, [a, b, c]) => ({
        hook: `So sánh nhanh: ${P} khác gì hàng trôi nổi ngoài chợ?`,
        body: `Hàng trôi nổi thường rẻ hơn vài chục nghìn, nhưng dùng một thời gian là lộ nhược điểm. Còn ${P} thì ${a}, lại thêm ${b}. Quan trọng nhất là ${c}, thứ mà hàng giá rẻ gần như không có.`,
        cta: `Đầu tư một lần cho yên tâm, bấm giỏ hàng vàng bên dưới để đặt hàng ngay.`,
      }),
    },
  ],
  urgent: [
    {
      angle: "Hàng đi nhanh",
      make: (P, [a, b, c]) => ({
        hook: `Dừng tay! ${P} đợt này đang được đặt rất nhanh.`,
        body: `Lý do rất đơn giản: ${a}, ${b}, và ${c}. Một món vừa chất lượng vừa đáng tiền như vậy thì không bao giờ nằm trong kho lâu. Hết đợt này lại phải chờ hàng về, mà chờ thì ai cũng sốt ruột.`,
        cta: `Bấm giỏ hàng vàng ngay bây giờ, chốt đơn trước khi hết hàng!`,
      }),
    },
    {
      angle: "Đừng chần chừ",
      make: (P, [a, b, c]) => ({
        hook: `Còn đang suy nghĩ à? Người khác đã đặt ${P} xong rồi đó.`,
        body: `Mỗi ngày chần chừ là thêm một ngày bạn chịu cảnh bất tiện. Trong khi chỉ cần ${P}: ${a}. Thêm nữa, ${b}. Và đặc biệt, ${c}. Đặt hôm nay, vài ngày nữa là bạn đã dùng được rồi.`,
        cta: `Đừng để hết hàng mới tiếc, bấm vào giỏ hàng vàng và đặt ngay!`,
      }),
    },
    {
      angle: "3 lý do – 1 quyết định",
      make: (P, [a, b, c]) => ({
        hook: `Ba giây thôi, nghe xong rồi quyết: ${P} có đáng mua không?`,
        body: `Đáng, và đây là lý do. Một, ${a}. Hai, ${b}. Ba, ${c}. Đủ lý do chưa? Đủ rồi thì đừng lướt nữa, vì deal tốt không đợi ai cả.`,
        cta: `Giỏ hàng vàng ngay góc trái: bấm vào, chọn mẫu, đặt hàng, xong trong một phút!`,
      }),
    },
  ],
};

function buildScripts(product: string, highlights: string, style: StyleId): Script[] {
  const hl = parseHighlights(highlights);
  return TEMPLATES[style].map((t, i) => {
    const s = t.make(product, hl);
    const words = `${s.hook} ${s.body} ${s.cta}`.split(/\s+/).length;
    return { id: `${Date.now()}-${i}`, angle: t.angle, ...s, seconds: Math.round(words / 2.7) };
  });
}

/* =====================================================================
   TRANG CHỦ
   ===================================================================== */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#0F172A] antialiased">
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <Header />
      <main>
        <Hero />
        <PainPoints />
        <HowItWorks />
        <DemoSection />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------ HEADER ------------------------------ */
function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled ? "border-slate-200 bg-white/90 backdrop-blur-md" : "border-transparent bg-white"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Điều hướng chính">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-slate-600 transition hover:text-[#FF5722]">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#trai-nghiem"
            className="hidden items-center gap-1.5 rounded-full bg-[#FF5722] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#FF5722]/30 transition hover:bg-[#E64A19] sm:inline-flex"
          >
            Dùng thử miễn phí <ArrowRight className="h-4 w-4" />
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-2 md:hidden">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 font-medium text-slate-700 hover:bg-slate-50">
              {n.label}
            </a>
          ))}
          <a
            href="#trai-nghiem"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-[#FF5722] py-3 font-bold text-white"
          >
            Dùng thử miễn phí <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </header>
  );
}

/* ------------------------------- HERO ------------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#FF5722]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full bg-slate-200/60 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28 lg:pt-20">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#FF5722]/20 bg-[#FFF3EE] px-3.5 py-1.5 text-xs font-bold text-[#E64A19] sm:text-sm">
            <Zap className="h-4 w-4" fill="currentColor" /> Dành cho chủ shop TikTok Shop & Shopee
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[58px]">
            Bí ý tưởng quay video?
            <br />
            <span className="relative whitespace-nowrap text-[#FF5722]">
              Đơn AI
              <svg viewBox="0 0 200 12" className="absolute -bottom-2 left-0 h-3 w-full" preserveAspectRatio="none" aria-hidden="true">
                <path d="M2 9 C 50 2, 150 2, 198 8" fill="none" stroke="#FF5722" strokeWidth="4" strokeLinecap="round" opacity=".35" />
              </svg>
            </span>{" "}
            viết hộ bạn.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            <strong className="font-bold text-[#0F172A]">Biến mọi sản phẩm thành kịch bản bão đơn trong 60 giây.</strong> Nhập tên sản phẩm,
            nhận ngay 3 kịch bản có câu mở đầu giữ chân người xem, giọng đọc AI chuẩn tiếng Việt và video dọc 9:16 dựng từ ảnh sản phẩm của bạn.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#trai-nghiem"
              className="cta-glow group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF5722] px-7 py-4 text-base font-extrabold text-white shadow-xl shadow-[#FF5722]/35 transition hover:-translate-y-0.5 hover:bg-[#E64A19]"
            >
              <Wand2 className="h-5 w-5" />
              Tạo kịch bản miễn phí ngay
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </a>
            <a
              href="#bang-gia"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-7 py-4 text-base font-bold text-[#0F172A] transition hover:border-[#0F172A]"
            >
              Xem bảng giá
            </a>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
            {["Không cần thẻ ngân hàng", "Thử ngay trên trang", "Giọng đọc chuẩn Việt"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF5722]" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="fade-up relative mx-auto w-full max-w-md" style={{ animationDelay: "150ms" }}>
      <div className="absolute -inset-4 rotate-3 rounded-[2rem] bg-[#0F172A]" />
      <div className="relative rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="text-sm font-bold">Kịch bản #1</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <Clock className="h-3.5 w-3.5" /> 52 giây
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-[#FFF3EE] p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#E64A19]">Mở đầu 3 giây</div>
            <p className="mt-1 text-sm font-bold leading-snug">“Đừng lướt qua! Không biết món này là thiệt thòi lắm đó.”</p>
          </div>
          <div className="space-y-1.5 px-1">
            <div className="h-2.5 w-full rounded-full bg-slate-100" />
            <div className="h-2.5 w-11/12 rounded-full bg-slate-100" />
            <div className="h-2.5 w-4/5 rounded-full bg-slate-100" />
          </div>
          <div className="rounded-xl bg-[#0F172A] p-3 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FF5722]">
                <Pause className="h-4 w-4" fill="currentColor" />
              </span>
              <div className="flex h-8 flex-1 items-center gap-[3px]">
                {Array.from({ length: 28 }, (_, i) => (
                  <span
                    key={i}
                    className="wave flex-1 rounded-full bg-[#FF5722]"
                    style={{ height: `${30 + Math.abs(Math.sin(i * 1.3)) * 70}%`, animationDelay: `${(i % 7) * 110}ms`, opacity: i < 17 ? 1 : 0.3 }}
                  />
                ))}
              </div>
              <span className="font-mono text-xs text-slate-300">0:31</span>
            </div>
          </div>
        </div>
      </div>

      <div className="float absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:block">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Timer className="h-4 w-4 text-[#FF5722]" /> Xong trong 60 giây
        </div>
      </div>
      <div className="float absolute -top-6 right-8 hidden rounded-2xl bg-[#FF5722] px-4 py-3 text-white shadow-xl sm:block" style={{ animationDelay: "1.2s" }}>
        <div className="flex items-center gap-2 text-sm font-bold">
          <Mic className="h-4 w-4" /> 3 giọng đọc AI
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- NỖI ĐAU ---------------------------- */
function PainPoints() {
  const pains = [
    { icon: Lightbulb, title: "Ngày nào cũng bí ý tưởng", desc: "Muốn lên video đều mà nhìn sản phẩm mãi không biết nói gì cho cuốn." },
    { icon: Wallet, title: "Thuê người viết thì tốn kém", desc: "Mỗi kịch bản vài trăm nghìn, chờ vài ngày, sửa đi sửa lại vẫn chưa ưng." },
    { icon: Mic, title: "Tự thu âm mất cả buổi", desc: "Đọc vấp, giọng run, thu lại hàng chục lần cho một video ngắn." },
  ];
  return (
    <section id="tinh-nang" className="scroll-mt-20 bg-slate-50 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Nỗi lo của chủ shop" title="Làm video bán hàng không khó, khó là làm đều mỗi ngày" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {pains.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0F172A] text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-lg font-semibold">
          Đơn AI xử lý cả ba việc đó <span className="text-[#FF5722]">trong một lần bấm.</span>
        </p>
      </div>
    </section>
  );
}

/* ------------------------- CÁCH HOẠT ĐỘNG ------------------------- */
function HowItWorks() {
  const steps = [
    { icon: PenLine, title: "Nhập sản phẩm", desc: "Tên sản phẩm và vài điểm nổi bật, hoặc dán mô tả từ Shopee/TikTok." },
    { icon: Sparkles, title: "AI viết 3 kịch bản", desc: "3 góc khai thác khác nhau, đủ Hook 3 giây, nội dung chính và lời chốt đơn." },
    { icon: Film, title: "Xuất video hoàn chỉnh", desc: "Ghép ảnh sản phẩm, giọng đọc AI và phụ đề chạy chữ thành video dọc 9:16, tải MP4 về đăng ngay." },
  ];
  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Cách hoạt động" title="3 bước, 60 giây, xong một video" />
        <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
          <div className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-slate-200 md:block" />
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative text-center">
              <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#FF5722] text-white shadow-lg shadow-[#FF5722]/30">
                <Icon className="h-7 w-7" />
                <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-[#0F172A] text-xs font-extrabold text-white ring-4 ring-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mx-auto mt-2 max-w-xs leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- DEMO TƯƠNG TÁC --------------------------- */
const EXAMPLES = [
  { name: "Quạt mini cầm tay", hl: "pin dùng liên tục 8 tiếng, 3 tốc độ gió mát lạnh, sạc nhanh cổng Type-C" },
  { name: "Serum Vitamin C", hl: "thấm nhanh không bết dính, chai nhỏ gọn mang theo tiện, kết cấu mỏng nhẹ" },
  { name: "Nồi chiên không dầu 6L", hl: "nướng gà nguyên con vẫn vừa, ít dầu mỡ hơn chiên rán, lòng nồi chống dính dễ rửa" },
];
const DEMO_CREDITS = 20;
const COST = { script: 1, review: 2, pro: 15 } as const;
const MIN_PHOTOS = 3;
const MAX_PHOTOS = 5;

type Photo = { id: string; url: string; img: HTMLImageElement };

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const VIDEO_FONT = "'Be Vietnam Pro', system-ui, sans-serif";

// Ảnh mẫu để thử nhanh khi khách chưa có ảnh thật
async function makeSamplePhotos(product: string): Promise<Photo[]> {
  const palettes: [string, string, boolean][] = [
    ["#FF5722", "#FFB199", true],
    ["#0F172A", "#334155", false],
    ["#FFF3EE", "#FFD3C2", true],
    ["#1E293B", "#FF5722", false],
  ];
  const out: Photo[] = [];
  for (let i = 0; i < palettes.length; i++) {
    const [a, b, whiteBox] = palettes[i];
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 800;
    const g = c.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 800, 800);
    grd.addColorStop(0, a);
    grd.addColorStop(1, b);
    g.fillStyle = grd;
    g.fillRect(0, 0, 800, 800);
    g.save();
    g.shadowColor = "rgba(0,0,0,.35)";
    g.shadowBlur = 60;
    g.shadowOffsetY = 30;
    g.fillStyle = whiteBox ? "#FFFFFF" : "#0F172A";
    roundRectPath(g, 210 + (i % 2) * 20, 170 + (i % 3) * 10, 360, 440, 48);
    g.fill();
    g.restore();
    g.fillStyle = "#FF5722";
    g.beginPath();
    g.arc(400 + (i % 2) * 20, 320, 72, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = whiteBox ? "#0F172A" : "#FFFFFF";
    g.textAlign = "center";
    g.font = `800 38px ${VIDEO_FONT}`;
    const words = (product || "Sản phẩm").split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (g.measureText(test).width > 300 && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    lines.push(line);
    lines.slice(0, 3).forEach((l, k) => g.fillText(l, 400 + (i % 2) * 20, 460 + k * 46));
    g.font = `600 26px ${VIDEO_FONT}`;
    g.fillStyle = i === 2 ? "#0F172A" : "#FFFFFF";
    g.fillText(`Ảnh mẫu ${i + 1}`, 400, 730);
    const blob = await new Promise<Blob>((r) => c.toBlob((bl) => r(bl!), "image/jpeg", 0.9));
    const url = URL.createObjectURL(blob);
    out.push({ id: `sample-${Date.now()}-${i}`, url, img: await loadImage(url) });
  }
  return out;
}

function DemoSection() {
  const [product, setProduct] = useState("");
  const [highlights, setHighlights] = useState("");
  const [style, setStyle] = useState<StyleId>("trend");
  const [voice, setVoice] = useState<VoiceId>("north");
  const [credits, setCredits] = useState(DEMO_CREDITS);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [usedVoice, setUsedVoice] = useState<VoiceId>("north");
  const [usedProduct, setUsedProduct] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [paidReview, setPaidReview] = useState<Record<string, boolean>>({});
  const [videoFor, setVideoFor] = useState<Script | null>(null);
  const [proFor, setProFor] = useState<Script | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "warn" } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const [flashUpload, setFlashUpload] = useState(false);

  const canGenerate = product.trim().length >= 2 && !loading && credits >= COST.script;

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const spend = (n: number) => {
    if (credits < n) {
      setNotice({ text: `Không đủ Credit: cần ${n}, ví demo còn ${credits}. Xem bảng giá để nạp thêm.`, tone: "warn" });
      return false;
    }
    setCredits((c) => c - n);
    return true;
  };

  const generate = () => {
    if (!canGenerate || !spend(COST.script)) return;
    setLoading(true);
    setStep(0);
    setScripts([]);
    setActiveId(null);
    setPaidReview({});
    stopSpeech();
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
    setTimeout(() => setStep(1), 650);
    setTimeout(() => setStep(2), 1350);
    setTimeout(() => {
      setScripts(buildScripts(product.trim(), highlights, style));
      setUsedVoice(voice);
      setUsedProduct(product.trim());
      setLoading(false);
    }, 2000);
  };

  const openReview = (s: Script) => {
    if (photos.length < MIN_PHOTOS) {
      setNotice({ text: `Cần ít nhất ${MIN_PHOTOS} ảnh sản phẩm để dựng video. Tải ảnh lên ở bảng bên trái nhé.`, tone: "warn" });
      uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashUpload(true);
      setTimeout(() => setFlashUpload(false), 1600);
      return;
    }
    if (!paidReview[s.id]) {
      if (!spend(COST.review)) return;
      setPaidReview((p) => ({ ...p, [s.id]: true }));
    }
    stopSpeech();
    setActiveId(null);
    setVideoFor(s);
  };

  return (
    <section id="trai-nghiem" className="scroll-mt-16 bg-[#0F172A] py-20 text-white lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Trải nghiệm trực tiếp" title="Từ ảnh sản phẩm đến video hoàn chỉnh" dark>
          Tải ảnh, tạo kịch bản, rồi xuất video dọc 9:16 có phụ đề ngay trên trang. Ví demo có sẵn {DEMO_CREDITS} Credits để bạn thử.
        </SectionTitle>

        <div className="mt-12 grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Bảng điều khiển */}
          <div className="self-start rounded-3xl bg-white p-6 text-[#0F172A] shadow-2xl lg:sticky lg:top-20">
            <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#FFF3EE] px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Ví demo</span>
              <span key={credits} className="pop inline-flex items-center gap-1.5 text-sm font-extrabold text-[#C2410C]">
                <Coins className="h-4 w-4" /> {credits} Credits
              </span>
            </div>

            <label className="text-sm font-bold" htmlFor="demo-product">
              Tên sản phẩm
            </label>
            <input
              id="demo-product"
              value={product}
              onChange={(e) => setProduct(e.target.value.slice(0, 80))}
              placeholder="vd: Quạt mini cầm tay"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#FF5722] focus:bg-white focus:ring-4 focus:ring-[#FF5722]/15"
            />
            <label className="mt-4 block text-sm font-bold" htmlFor="demo-hl">
              Điểm nổi bật <span className="font-normal text-slate-400">(không bắt buộc)</span>
            </label>
            <textarea
              id="demo-hl"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value.slice(0, 300))}
              rows={2}
              placeholder="Cách nhau bằng dấu phẩy, vd: pin 8 tiếng, 3 tốc độ gió"
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#FF5722] focus:bg-white focus:ring-4 focus:ring-[#FF5722]/15"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => {
                    setProduct(ex.name);
                    setHighlights(ex.hl);
                  }}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-[#FF5722] hover:text-[#C2410C]"
                >
                  {ex.name}
                </button>
              ))}
            </div>

            <div ref={uploadRef} className="scroll-mt-24">
              <PhotoUploader photos={photos} setPhotos={setPhotos} product={product} flash={flashUpload} />
            </div>

            <div className="mt-5 text-sm font-bold">Phong cách</div>
            <div className="mt-2 grid gap-2">
              {STYLES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setStyle(id)}
                  aria-pressed={style === id}
                  className={`flex items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left text-sm font-semibold transition ${
                    style === id ? "border-[#FF5722] bg-[#FFF3EE] text-[#0F172A]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${style === id ? "text-[#FF5722]" : "text-slate-400"}`} />
                  {label}
                  {style === id && <Check className="ml-auto h-4 w-4 text-[#FF5722]" />}
                </button>
              ))}
            </div>

            <div className="mt-5 text-sm font-bold">Giọng đọc</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoice(v.id)}
                  aria-pressed={voice === v.id}
                  className={`rounded-xl border-2 px-2 py-2.5 text-xs font-bold transition ${
                    voice === v.id ? "border-[#FF5722] bg-[#FFF3EE] text-[#0F172A]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Mic className={`mx-auto mb-1 h-4 w-4 ${voice === v.id ? "text-[#FF5722]" : "text-slate-400"}`} />
                  {v.label}
                </button>
              ))}
            </div>

            <button
              onClick={generate}
              disabled={!canGenerate}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF5722] py-4 text-[17px] font-extrabold text-white shadow-lg shadow-[#FF5722]/30 transition hover:bg-[#E64A19] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {loading ? "Đang viết kịch bản..." : `Tạo 3 kịch bản (${COST.script} Credit)`}
            </button>
            <p className="mt-2.5 text-center text-xs text-slate-500">
              {credits >= COST.script ? (
                "Credit trong ví demo chỉ để thử, không phải tiền thật."
              ) : (
                <>
                  Ví demo đã hết.{" "}
                  <a href="#bang-gia" className="font-bold text-[#C2410C] underline">
                    Xem bảng giá
                  </a>
                </>
              )}
            </p>
          </div>

          {/* Kết quả */}
          <div ref={resultRef} className="min-w-0 scroll-mt-24">
            {notice && (
              <div
                className={`fade-up mb-4 flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  notice.tone === "warn" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                }`}
              >
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {notice.text}
              </div>
            )}
            {loading ? (
              <DemoLoading step={step} />
            ) : scripts.length ? (
              <div className="space-y-4">
                {scripts.map((s, i) => (
                  <DemoScriptCard
                    key={s.id}
                    index={i}
                    script={s}
                    product={usedProduct}
                    voice={VOICES.find((v) => v.id === usedVoice)!}
                    active={activeId === s.id}
                    onActivate={() => setActiveId(s.id)}
                    photoCount={photos.length}
                    reviewPaid={!!paidReview[s.id]}
                    onReview={() => openReview(s)}
                    onPro={() => {
                      stopSpeech();
                      setActiveId(null);
                      setProFor(s);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/15 p-8 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#FF5722] shadow-lg shadow-[#FF5722]/30">
                  <MousePointerClick className="h-8 w-8" />
                </span>
                <h3 className="mt-5 text-xl font-bold">Kịch bản và video sẽ hiện ở đây</h3>
                <p className="mt-2 max-w-sm text-slate-400">
                  Nhập tên sản phẩm, tải 3–5 ảnh (hoặc dùng ảnh mẫu), rồi bấm “Tạo 3 kịch bản”. Dưới mỗi kịch bản có nút xuất video.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {videoFor && (
        <VideoModal
          script={videoFor}
          index={scripts.findIndex((s) => s.id === videoFor.id)}
          photos={photos}
          product={usedProduct}
          voice={VOICES.find((v) => v.id === usedVoice)!}
          onClose={() => setVideoFor(null)}
        />
      )}
      {proFor && <ProModal credits={credits} onClose={() => setProFor(null)} />}
    </section>
  );
}

/* ---------------------- TẢI ẢNH SẢN PHẨM (kéo thả) ---------------------- */
function PhotoUploader({
  photos,
  setPhotos,
  product,
  flash,
}: {
  photos: Photo[];
  setPhotos: Dispatch<SetStateAction<Photo[]>>;
  product: string;
  flash: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const skipped = Array.from(files).length - list.length;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setMsg(`Tối đa ${MAX_PHOTOS} ảnh. Xoá bớt ảnh để thêm ảnh mới.`);
      return;
    }
    const take = list.slice(0, room);
    const loaded: Photo[] = [];
    for (const f of take) {
      const url = URL.createObjectURL(f);
      try {
        loaded.push({ id: `${f.name}-${f.size}-${Math.random()}`, url, img: await loadImage(url) });
      } catch {
        URL.revokeObjectURL(url);
      }
    }
    setPhotos((p) => [...p, ...loaded].slice(0, MAX_PHOTOS));
    const notes: string[] = [];
    if (skipped) notes.push(`${skipped} file không phải ảnh đã bị bỏ qua`);
    if (list.length > room) notes.push(`chỉ nhận thêm ${room} ảnh (tối đa ${MAX_PHOTOS})`);
    setMsg(notes.length ? cap(notes.join(", ")) + "." : null);
  };

  const remove = (id: string) => {
    setPhotos((p) => {
      const hit = p.find((x) => x.id === id);
      if (hit) URL.revokeObjectURL(hit.url);
      return p.filter((x) => x.id !== id);
    });
  };

  const useSamples = async () => {
    setBusy(true);
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos(await makeSamplePhotos(product.trim()));
    setMsg(null);
    setBusy(false);
  };

  const enough = photos.length >= MIN_PHOTOS;

  return (
    <div className={`mt-5 rounded-2xl transition ${flash ? "ring-4 ring-[#FF5722]/60" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">
          Ảnh sản phẩm <span className="font-normal text-slate-400">(3–5 ảnh, để làm video)</span>
        </span>
        <span className={`text-xs font-bold ${enough ? "text-emerald-600" : "text-slate-400"}`}>
          {photos.length}/{MAX_PHOTOS}
        </span>
      </div>

      {photos.length > 0 && (
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {photos.map((p, i) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
              <img src={p.url} alt={`Ảnh sản phẩm ${i + 1}`} className="h-full w-full object-cover" />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-bold text-white">{i + 1}</span>
              <button
                onClick={() => remove(p.id)}
                aria-label={`Xoá ảnh ${i + 1}`}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white opacity-90 transition hover:bg-[#FF5722]"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < MAX_PHOTOS && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
          }}
          className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
            dragging ? "border-[#FF5722] bg-[#FFF3EE]" : "border-slate-300 bg-slate-50 hover:border-[#FF5722] hover:bg-[#FFF3EE]/60"
          }`}
        >
          <ImagePlus className={`h-7 w-7 ${dragging ? "text-[#FF5722]" : "text-slate-400"}`} />
          <p className="mt-1.5 text-sm font-semibold text-slate-700">{dragging ? "Thả ảnh vào đây" : "Kéo thả ảnh vào đây hoặc bấm để chọn"}</p>
          <p className="text-xs text-slate-500">JPG, PNG, WEBP · còn nhận {MAX_PHOTOS - photos.length} ảnh</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{msg ?? (enough ? "Đủ ảnh để xuất video." : `Cần thêm ${MIN_PHOTOS - photos.length} ảnh để xuất video.`)}</span>
        <button
          onClick={useSamples}
          disabled={busy}
          className="shrink-0 text-xs font-bold text-[#C2410C] underline-offset-2 hover:underline disabled:opacity-50"
        >
          {busy ? "Đang tạo..." : "Dùng 4 ảnh mẫu"}
        </button>
      </div>
    </div>
  );
}

const LOADING_STEPS = ["Phân tích sản phẩm", "Viết 3 kịch bản bão đơn", "Thu âm giọng đọc"];

function DemoLoading({ step }: { step: number }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
        <ol className="space-y-2.5">
          {LOADING_STEPS.map((label, i) => (
            <li key={label} className={`flex items-center gap-2.5 text-sm font-medium ${i <= step ? "text-white" : "text-slate-500"}`}>
              {i < step ? (
                <CheckCircle2 className="h-5 w-5 text-[#FF5722]" />
              ) : i === step ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#FF5722]" />
              ) : (
                <span className="h-5 w-5 rounded-full border-2 border-slate-600" />
              )}
              {label}
            </li>
          ))}
        </ol>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="loading-bar h-full rounded-full bg-[#FF5722]" />
        </div>
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="animate-pulse rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-5/6 rounded bg-white/10" />
            <div className="h-3 w-2/3 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Mark({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const parts = text.split(term);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="rounded bg-[#FFF3EE] px-1 font-bold text-[#C2410C]">{term}</span>}
        </span>
      ))}
    </>
  );
}

function DemoScriptCard({
  index,
  script,
  product,
  voice,
  active,
  onActivate,
  photoCount,
  reviewPaid,
  onReview,
  onPro,
}: {
  index: number;
  script: Script;
  product: string;
  voice: (typeof VOICES)[number];
  active: boolean;
  onActivate: () => void;
  photoCount: number;
  reviewPaid: boolean;
  onReview: () => void;
  onPro: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const fullText = `${script.hook}\n\n${script.body}\n\n${script.cta}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = fullText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* trình duyệt chặn copy */
      }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const enoughPhotos = photoCount >= MIN_PHOTOS;

  return (
    <article className="card-in overflow-hidden rounded-3xl bg-white text-[#0F172A] shadow-xl" style={{ animationDelay: `${index * 120}ms` }}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0F172A] text-sm font-extrabold text-white">{index + 1}</span>
          <div className="leading-tight">
            <div className="text-sm font-bold">Kịch bản {index + 1}</div>
            <div className="text-xs text-slate-500">
              {script.angle} · ~{script.seconds} giây
            </div>
          </div>
        </div>
        <button
          onClick={copy}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
            copied ? "bg-emerald-50 text-emerald-700" : "bg-[#0F172A] text-white hover:bg-slate-700"
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Đã copy" : "Copy"}
        </button>
      </div>
      <div className="space-y-3.5 px-5 py-4">
        <ScriptPart label="Mở đầu · 3 giây đầu" tone="text-[#C2410C] bg-[#FFF3EE]">
          <p className="text-[15px] font-bold leading-snug">
            <Mark text={script.hook} term={product} />
          </p>
        </ScriptPart>
        <ScriptPart label="Nội dung chính" tone="text-slate-600 bg-slate-100">
          <p className="text-sm leading-relaxed text-slate-700">
            <Mark text={script.body} term={product} />
          </p>
        </ScriptPart>
        <ScriptPart label="Kêu gọi chốt đơn" tone="text-white bg-[#0F172A]">
          <p className="text-sm font-semibold leading-relaxed">
            <Mark text={script.cta} term={product} />
          </p>
        </ScriptPart>
      </div>
      <VoicePlayer text={`${script.hook} ${script.body} ${script.cta}`} seconds={script.seconds} voice={voice} active={active} onActivate={onActivate} />

      {/* ----- Xuất bản video ----- */}
      <div className="border-t border-slate-100 px-5 py-4">
        <div className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">Xuất bản video</div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <button
            onClick={onReview}
            className="group relative flex flex-col rounded-2xl border-2 border-[#FF5722] bg-[#FFF3EE] p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#FF5722]/20"
          >
            <span className="absolute right-3 top-3 rounded-full bg-[#0F172A] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">Mặc định</span>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FF5722] text-white">
              <Film className="h-5 w-5" />
            </span>
            <span className="mt-2.5 pr-14 text-sm font-extrabold leading-snug">Xuất Video Review từ ảnh sản phẩm</span>
            <span className="mt-1 text-xs leading-snug text-slate-600">Video dọc 9:16 · hiệu ứng chuyển động · phụ đề kiểu TikTok · giọng đọc AI</span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-extrabold text-[#C2410C]">
              {reviewPaid ? (
                <>
                  <Play className="h-4 w-4" fill="currentColor" /> Xem lại video (đã trả)
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" /> Tốn {COST.review} Credits
                  {!enoughPhotos && <span className="font-semibold text-slate-500">· cần {MIN_PHOTOS} ảnh</span>}
                </>
              )}
            </span>
          </button>

          <button
            onClick={onPro}
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#0F172A] p-3.5 text-left text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#0F172A]/30"
          >
            <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#FF5722]/25 blur-2xl" />
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-[#FF5722] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#0F172A]">
              <Crown className="h-3 w-3" /> Pro
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-amber-300">
              <Clapperboard className="h-5 w-5" />
            </span>
            <span className="mt-2.5 pr-12 text-sm font-extrabold leading-snug">Tạo Video AI người mẫu chuyển động thực</span>
            <span className="mt-1 text-xs leading-snug text-slate-400">Người mẫu AI giới thiệu sản phẩm, khẩu hình khớp giọng đọc</span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-extrabold text-amber-300">
              <Coins className="h-4 w-4" /> Tốn {COST.pro} Credits
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

function ScriptPart({ label, tone, children }: { label: string; tone: string; children: ReactNode }) {
  return (
    <div>
      <span className={`mb-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${tone}`}>{label}</span>
      {children}
    </div>
  );
}

/* ---------- Trình phát: dùng giọng tiếng Việt của trình duyệt nếu có, nếu không thì mô phỏng ---------- */
function getViVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("vi")) ?? null;
}
function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

const BARS = 44;

function VoicePlayer({
  text,
  seconds,
  voice,
  active,
  onActivate,
}: {
  text: string;
  seconds: number;
  voice: (typeof VOICES)[number];
  active: boolean;
  onActivate: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speaking, setSpeaking] = useState(false); // đang dùng giọng thật của trình duyệt
  const last = useRef(0);
  const heights = useMemo(() => Array.from({ length: BARS }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 0.75), []);

  useEffect(() => {
    if (!active && playing) {
      setPlaying(false);
      if (speaking) stopSpeech();
    }
  }, [active, playing, speaking]);

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = (now - last.current) / 1000;
      last.current = now;
      setElapsed((e) => {
        const next = e + dt;
        if (next >= seconds) {
          setPlaying(false);
          return seconds;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing, seconds]);

  const toggle = () => {
    const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

    if (playing) {
      setPlaying(false);
      if (speaking && synth) synth.pause();
      return;
    }

    onActivate();
    const restart = elapsed === 0 || elapsed >= seconds;
    if (restart) setElapsed(0);

    const vi = getViVoice();
    if (synth && vi) {
      if (!restart && speaking && synth.paused) {
        synth.resume();
      } else {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.voice = vi;
        u.lang = vi.lang;
        u.rate = voice.rate;
        u.pitch = voice.pitch;
        u.onend = () => {
          setElapsed(seconds);
          setPlaying(false);
        };
        synth.speak(u);
      }
      setSpeaking(true);
    } else {
      setSpeaking(false);
    }
    setPlaying(true);
  };

  const progress = seconds ? elapsed / seconds : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          aria-label={playing ? "Tạm dừng" : "Nghe thử giọng đọc"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FF5722] text-white shadow-md shadow-[#FF5722]/30 transition hover:scale-105 active:scale-95"
        >
          {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-bold text-slate-700">
              {playing ? "Đang phát" : "Nghe thử giọng đọc"} · {voice.label}
            </span>
            <span className="shrink-0 font-mono tabular-nums text-slate-500">
              {fmt(elapsed)} / {fmt(seconds)}
            </span>
          </div>
          <div className="flex h-7 items-center gap-[2px]">
            {heights.map((h, i) => (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors ${i / BARS < progress ? "bg-[#FF5722]" : "bg-slate-200"} ${playing ? "wave" : ""}`}
                style={{ height: `${h * 100}%`, animationDelay: `${(i % 8) * 90}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        {speaking ? "Bản demo dùng giọng tiếng Việt có sẵn của trình duyệt." : "Bản demo mô phỏng thời gian phát."} Bản đầy đủ xuất file MP3 giọng AI.
      </p>
    </div>
  );
}

/* =====================================================================
   VIDEO REVIEW 9:16 — dựng ngay trên trình duyệt bằng <canvas>
   Ảnh chuyển động (Ken Burns) + phụ đề chạy chữ kiểu TikTok + giọng đọc
   ===================================================================== */
const VW = 540;
const VH = 960;

type Caption = { words: string[]; start: number; end: number; wordStarts: number[] };

function buildCaptions(text: string, total: number): Caption[] {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => 1 + (/[.!?]$/.test(w) ? 0.8 : /[,:;]$/.test(w) ? 0.4 : 0));
  const k = total / weights.reduce((a, b) => a + b, 0);
  const caps: Caption[] = [];
  let cur: string[] = [];
  let starts: number[] = [];
  let t = 0;
  let start = 0;
  words.forEach((w, i) => {
    if (!cur.length) start = t;
    starts.push(t);
    cur.push(w);
    t += weights[i] * k;
    const breakHere = cur.length >= 5 || /[.!?]$/.test(w) || (/[,:;]$/.test(w) && cur.length >= 3) || i === words.length - 1;
    if (breakHere) {
      caps.push({ words: cur, start, end: t, wordStarts: starts });
      cur = [];
      starts = [];
    }
  });
  return caps;
}

type VideoSpec = { photos: HTMLImageElement[]; caps: Caption[]; total: number; product: string; hook: string };

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, scale: number, dx: number, dy: number, alpha: number) {
  const s = Math.max(VW / img.width, VH / img.height) * scale;
  const w = img.width * s;
  const h = img.height * s;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (VW - w) / 2 + dx, (VH - h) / 2 + dy, w, h);
  ctx.globalAlpha = 1;
}

function kenBurns(i: number, p: number): [number, number, number] {
  const zoomIn = i % 2 === 0;
  const scale = zoomIn ? 1.04 + 0.16 * p : 1.2 - 0.16 * p;
  const dx = (i % 3 === 0 ? 1 : -1) * 36 * (p - 0.5);
  const dy = (i % 2 ? -1 : 1) * 24 * (p - 0.5);
  return [scale, dx, dy];
}

function wrapWords(ctx: CanvasRenderingContext2D, words: string[], maxW: number) {
  const space = ctx.measureText(" ").width;
  const lines: { idx: number[]; width: number }[] = [];
  let line: number[] = [];
  let width = 0;
  words.forEach((w, i) => {
    const ww = ctx.measureText(w).width;
    const next = line.length ? width + space + ww : ww;
    if (next > maxW && line.length) {
      lines.push({ idx: line, width });
      line = [i];
      width = ww;
    } else {
      line.push(i);
      width = next;
    }
  });
  if (line.length) lines.push({ idx: line, width });
  return { lines, space };
}

function drawFrame(ctx: CanvasRenderingContext2D, t: number, spec: VideoSpec) {
  const { photos, caps, total } = spec;
  const n = photos.length;
  const seg = total / n;
  const FADE = 0.6;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, VW, VH);

  // 1. Ảnh nền chuyển động + chuyển cảnh mờ dần
  const idx = Math.min(n - 1, Math.floor(t / seg));
  const local = t - idx * seg;
  const [s, dx, dy] = kenBurns(idx, Math.min(1, local / seg));
  drawCover(ctx, photos[idx], s, dx, dy, 1);
  if (idx < n - 1 && local > seg - FADE) {
    const [s2, dx2, dy2] = kenBurns(idx + 1, 0);
    drawCover(ctx, photos[idx + 1], s2, dx2, dy2, (local - (seg - FADE)) / FADE);
  }

  // 2. Lớp tối trên/dưới để chữ dễ đọc
  let g = ctx.createLinearGradient(0, 0, 0, 220);
  g.addColorStop(0, "rgba(0,0,0,.6)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VW, 220);
  g = ctx.createLinearGradient(0, VH - 480, 0, VH);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,.78)");
  ctx.fillStyle = g;
  ctx.fillRect(0, VH - 480, VW, 480);

  // 3. Thanh tiến trình kiểu story
  const gap = 6;
  const barW = (VW - 40 - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const x = 20 + i * (barW + gap);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    roundRectPath(ctx, x, 22, barW, 4, 2);
    ctx.fill();
    const fill = i < idx ? 1 : i === idx ? Math.min(1, local / seg) : 0;
    if (fill > 0) {
      ctx.fillStyle = "#FFFFFF";
      roundRectPath(ctx, x, 22, barW * fill, 4, 2);
      ctx.fill();
    }
  }

  // 4. Nhãn sản phẩm + logo
  ctx.textBaseline = "middle";
  ctx.font = `700 20px ${VIDEO_FONT}`;
  const label = spec.product.length > 28 ? spec.product.slice(0, 27) + "…" : spec.product;
  const lw = ctx.measureText(label).width;
  ctx.fillStyle = "rgba(255,255,255,.2)";
  roundRectPath(ctx, 20, 42, lw + 28, 36, 18);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(label, 34, 61);
  ctx.textAlign = "right";
  ctx.font = `800 20px ${VIDEO_FONT}`;
  ctx.fillText("Đơn", VW - 50, 61);
  ctx.fillStyle = "#FF5722";
  ctx.fillText("AI", VW - 22, 61);

  // 5. Thẻ HOOK nổi bật trong 3 giây đầu
  if (t < 3.3) {
    const appear = Math.min(1, t / 0.25);
    const fade = t > 2.9 ? Math.max(0, 1 - (t - 2.9) / 0.4) : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(VW / 2, 230);
    ctx.rotate(-0.035);
    const sc = 0.85 + 0.15 * appear;
    ctx.scale(sc, sc);
    ctx.font = `800 36px ${VIDEO_FONT}`;
    const words = spec.hook.split(/\s+/);
    const { lines, space } = wrapWords(ctx, words, VW - 120);
    const lh = 46;
    const boxH = lines.length * lh + 36;
    ctx.fillStyle = "#FF5722";
    roundRectPath(ctx, -(VW - 80) / 2, -boxH / 2, VW - 80, boxH, 26);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    lines.forEach((ln, li) => {
      let x = -ln.width / 2;
      const y = -boxH / 2 + 18 + lh / 2 + li * lh;
      ln.idx.forEach((wi) => {
        ctx.fillText(words[wi], x, y);
        x += ctx.measureText(words[wi]).width + space;
      });
    });
    ctx.restore();
  }

  // 6. Phụ đề chạy chữ, từ đang đọc được tô cam
  const cap = caps.find((c) => t >= c.start && t < c.end) ?? (t >= total ? caps[caps.length - 1] : null);
  // Trong lúc thẻ Hook đang hiện thì ẩn phụ đề để chữ không bị lặp
  if (cap && t >= 3.0) {
    ctx.save();
    ctx.font = `800 42px ${VIDEO_FONT}`;
    ctx.textAlign = "left";
    const { lines, space } = wrapWords(ctx, cap.words, VW - 70);
    const lh = 58;
    const pop = Math.min(1, (t - cap.start) / 0.12);
    const baseY = VH * 0.66;
    let active = cap.wordStarts.findIndex((ws, j) => t >= ws && (j === cap.wordStarts.length - 1 || t < cap.wordStarts[j + 1]));
    if (active < 0) active = cap.words.length - 1;
    ctx.translate(VW / 2, baseY);
    ctx.scale(0.92 + 0.08 * pop, 0.92 + 0.08 * pop);
    lines.forEach((ln, li) => {
      let x = -ln.width / 2;
      const y = li * lh;
      ln.idx.forEach((wi) => {
        const word = cap.words[wi];
        const ww = ctx.measureText(word).width;
        if (wi === active) {
          ctx.fillStyle = "#FF5722";
          roundRectPath(ctx, x - 8, y - 28, ww + 16, 54, 12);
          ctx.fill();
        }
        ctx.lineJoin = "round";
        ctx.lineWidth = 8;
        ctx.strokeStyle = "rgba(0,0,0,.85)";
        if (wi !== active) ctx.strokeText(word, x, y);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(word, x, y);
        x += ww + space;
      });
    });
    ctx.restore();
  }

  // 7. Nút kêu gọi ở 4,5 giây cuối
  if (t > total - 4.5) {
    const a = Math.min(1, (t - (total - 4.5)) / 0.3);
    const bounce = Math.sin(t * 7) * 5;
    ctx.save();
    ctx.globalAlpha = a;
    const w = 330;
    const x = (VW - w) / 2;
    const y = VH - 128 + bounce;
    ctx.fillStyle = "#FFFFFF";
    roundRectPath(ctx, x, y, w, 64, 32);
    ctx.fill();
    ctx.fillStyle = "#FF5722";
    ctx.beginPath();
    ctx.arc(x + 36, y + 32, 20, 0, Math.PI * 2);
    ctx.fill();
    // giỏ hàng nhỏ
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x + 26, y + 24);
    ctx.lineTo(x + 46, y + 24);
    ctx.lineTo(x + 43, y + 40);
    ctx.lineTo(x + 29, y + 40);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 22px ${VIDEO_FONT}`;
    ctx.textAlign = "left";
    ctx.fillText("BẤM GIỎ HÀNG NGAY", x + 68, y + 33);
    ctx.restore();
  }
  ctx.textBaseline = "alphabetic";
}

function pickVideoMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const list = ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return list.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

// Tải file: trong Artifact dùng quyền "downloads"; trên web thật dùng link tải bình thường
type ClaudeRuntime = { use: (name: string) => Promise<{ save: (r: { filename: string; data: Blob }) => Promise<unknown> } | null> };

async function saveFile(blob: Blob, filename: string): Promise<"saved" | "declined" | "browser"> {
  const runtime = (window as unknown as { claude?: ClaudeRuntime }).claude;
  if (runtime && typeof runtime.use === "function") {
    const downloads = await runtime.use("downloads").catch(() => null);
    if (downloads) {
      try {
        await downloads.save({ filename, data: blob });
        return "saved";
      } catch (e) {
        if ((e as { code?: string })?.code === "declined") return "declined";
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  return "browser";
}

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "san-pham";

const BUILD_STEPS = ["Ghép ảnh sản phẩm", "Thêm hiệu ứng chuyển động", "Chèn phụ đề chạy chữ", "Lồng giọng đọc AI"];

function VideoModal({
  script,
  index,
  photos,
  product,
  voice,
  onClose,
}: {
  script: Script;
  index: number;
  photos: Photo[];
  product: string;
  voice: (typeof VOICES)[number];
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [buildStep, setBuildStep] = useState(0);
  const ready = buildStep >= BUILD_STEPS.length;
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [hasVi, setHasVi] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const tRef = useRef(0);

  const total = script.seconds;
  const text = `${script.hook} ${script.body} ${script.cta}`;
  // Chụp lại bộ ảnh lúc mở để video không đổi nếu khách sửa ảnh ở ngoài
  const [frozenPhotos] = useState(() => photos.map((p) => p.img));
  const spec = useMemo<VideoSpec>(
    () => ({ photos: frozenPhotos, caps: buildCaptions(text, total), total, product, hook: script.hook }),
    [frozenPhotos, text, total, product, script.hook]
  );

  // Hiệu ứng "đang dựng video"
  useEffect(() => {
    if (ready) return;
    const id = setTimeout(() => setBuildStep((s) => s + 1), 450);
    return () => clearTimeout(id);
  }, [buildStep, ready]);

  // Vẽ khung đầu tiên khi sẵn sàng (chờ font tải xong)
  useEffect(() => {
    if (!ready) return;
    const draw = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) drawFrame(ctx, tRef.current, spec);
    };
    draw();
    document.fonts?.load(`800 40px "Be Vietnam Pro"`).then(draw).catch(() => {});
  }, [ready, spec]);

  // Có giọng tiếng Việt trong trình duyệt không?
  useEffect(() => {
    const check = () => setHasVi(!!getViVoice());
    check();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.addEventListener?.("voiceschanged", check);
      return () => window.speechSynthesis.removeEventListener?.("voiceschanged", check);
    }
  }, []);

  const speakFrom = (t: number) => {
    stopSpeech();
    const vi = getViVoice();
    if (!voiceOn || !vi) return;
    const ci = Math.max(0, spec.caps.findIndex((c) => t < c.end));
    const rest = spec.caps.slice(ci).flatMap((c) => c.words).join(" ");
    if (!rest) return;
    const u = new SpeechSynthesisUtterance(rest);
    u.voice = vi;
    u.lang = vi.lang;
    u.rate = voice.rate;
    u.pitch = voice.pitch;
    window.speechSynthesis.speak(u);
  };

  // Vòng lặp phát
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let lastUi = 0;
    const tick = (now: number) => {
      tRef.current = Math.min(total, tRef.current + (now - last) / 1000);
      last = now;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) drawFrame(ctx, tRef.current, spec);
      if (now - lastUi > 100) {
        setTime(tRef.current);
        lastUi = now;
      }
      if (tRef.current >= total) {
        setTime(total);
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, spec, total]);

  useEffect(() => () => stopSpeech(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && exportProgress === null && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const close = () => {
    stopSpeech();
    onClose();
  };

  const toggle = () => {
    if (!ready || exportProgress !== null) return;
    if (playing) {
      setPlaying(false);
      stopSpeech();
      return;
    }
    if (tRef.current >= total) tRef.current = 0;
    speakFrom(tRef.current);
    setPlaying(true);
  };

  const seek = (v: number) => {
    tRef.current = v;
    setTime(v);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawFrame(ctx, v, spec);
    if (playing) speakFrom(v);
  };

  const exportVideo = async () => {
    setExportMsg(null);
    const mime = pickVideoMime();
    const probe = document.createElement("canvas");
    if (!mime || typeof probe.captureStream !== "function") {
      setExportMsg("Trình duyệt này chưa hỗ trợ xuất video. Hãy mở bằng Chrome, Edge hoặc Safari bản mới.");
      return;
    }
    setPlaying(false);
    stopSpeech();
    probe.width = VW;
    probe.height = VH;
    const ctx = probe.getContext("2d")!;
    drawFrame(ctx, 0, spec);
    const stream = probe.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
    rec.start(500);
    setExportProgress(0);
    const t0 = performance.now();
    await new Promise<void>((resolve) => {
      const id = setInterval(() => {
        const t = (performance.now() - t0) / 1000;
        drawFrame(ctx, Math.min(t, total), spec);
        setExportProgress(Math.min(1, t / total));
        if (t >= total + 0.3) {
          clearInterval(id);
          resolve();
        }
      }, 1000 / 30);
    });
    rec.stop();
    await stopped;
    stream.getTracks().forEach((tr) => tr.stop());
    const ext = mime.includes("mp4") ? "mp4" : "webm";
    const blob = new Blob(chunks, { type: mime.split(";")[0] });
    setExportProgress(null);
    const result = await saveFile(blob, `don-ai-${slugify(product)}-kich-ban-${index + 1}.${ext}`);
    setExportMsg(
      result === "declined"
        ? "Bạn đã huỷ lưu file. Bấm tải lại bất cứ lúc nào."
        : `Đã xuất file ${ext.toUpperCase()} (${(blob.size / 1024 / 1024).toFixed(1)} MB).` +
            (ext === "webm" ? " Trình duyệt này chỉ xuất được WEBM; bản thật xuất MP4 trên máy chủ." : "")
    );
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const exporting = exportProgress !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F172A]/80 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => !exporting && close()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Xem trước video"
        onClick={(e) => e.stopPropagation()}
        className="modal-in max-h-[96vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white text-[#0F172A] shadow-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-3.5 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FF5722] text-white">
              <Film className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="font-extrabold">Video Review · Kịch bản {index + 1}</div>
              <div className="text-xs text-slate-500">
                9:16 · {frozenPhotos.length} ảnh · {fmt(total)} · {voice.label}
              </div>
            </div>
          </div>
          <button onClick={close} disabled={exporting} aria-label="Đóng" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[300px_1fr] md:p-6">
          {/* Khung điện thoại */}
          <div className="mx-auto w-full max-w-[300px]">
            <div className="relative rounded-[2.2rem] bg-[#0F172A] p-2.5 shadow-2xl">
              <div className="relative overflow-hidden rounded-[1.7rem] bg-black" style={{ aspectRatio: "9 / 16" }}>
                <canvas ref={canvasRef} width={VW} height={VH} onClick={toggle} className="h-full w-full cursor-pointer" />
                {!ready && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0F172A] px-6 text-white">
                    <Loader2 className="h-8 w-8 animate-spin text-[#FF5722]" />
                    <div className="text-sm font-bold">Đang dựng video...</div>
                    <ol className="w-full space-y-1.5 text-xs">
                      {BUILD_STEPS.map((s, i) => (
                        <li key={s} className={`flex items-center gap-2 ${i < buildStep ? "text-white" : "text-slate-500"}`}>
                          {i < buildStep ? <Check className="h-3.5 w-3.5 text-[#FF5722]" /> : <span className="h-3.5 w-3.5 rounded-full border border-slate-600" />}
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {ready && !playing && !exporting && (
                  <button onClick={toggle} aria-label="Phát video" className="absolute inset-0 grid place-items-center bg-black/25">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-[#FF5722] text-white shadow-xl transition hover:scale-105">
                      <Play className="ml-1 h-7 w-7" fill="currentColor" />
                    </span>
                  </button>
                )}
                {exporting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-8 text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin text-[#FF5722]" />
                    <div className="text-sm font-bold">Đang xuất video {Math.round((exportProgress ?? 0) * 100)}%</div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                      <div className="h-full rounded-full bg-[#FF5722] transition-[width]" style={{ width: `${(exportProgress ?? 0) * 100}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-300">Giữ tab này mở cho tới khi xong</div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              <button
                onClick={toggle}
                disabled={!ready || exporting}
                aria-label={playing ? "Tạm dừng" : "Phát"}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0F172A] text-white transition hover:bg-slate-700 disabled:opacity-40"
              >
                {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
              </button>
              <input
                type="range"
                min={0}
                max={total}
                step={0.1}
                value={time}
                disabled={!ready || exporting}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Tua video"
                className="h-1.5 flex-1 cursor-pointer accent-[#FF5722]"
              />
              <span className="w-[68px] shrink-0 text-right font-mono text-xs tabular-nums text-slate-500">
                {fmt(time)}/{fmt(total)}
              </span>
              <button
                onClick={() => {
                  setVoiceOn((v) => !v);
                  stopSpeech();
                  if (playing && !voiceOn) setTimeout(() => speakFrom(tRef.current), 0);
                }}
                aria-label={voiceOn ? "Tắt giọng đọc" : "Bật giọng đọc"}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100"
              >
                {voiceOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Thông tin & tải xuống */}
          <div className="flex flex-col">
            <h3 className="text-xl font-extrabold tracking-tight">Video sẵn sàng đăng TikTok & Shopee</h3>
            <p className="mt-1 text-sm text-slate-600">Bấm vào video để xem trước. Kéo thanh trượt để tua.</p>

            <ul className="mt-5 space-y-3">
              {[
                { icon: Film, t: "Ảnh chuyển động mượt", d: `${frozenPhotos.length} ảnh của bạn, phóng to thu nhỏ và chuyển cảnh mờ dần` },
                { icon: Zap, t: "Thẻ mở đầu 3 giây", d: "Câu Hook nổi bật giữ chân người xem ngay từ đầu" },
                { icon: Captions, t: "Phụ đề chạy chữ kiểu TikTok", d: "Từng từ được tô cam đúng lúc đọc" },
                { icon: Mic, t: `Giọng đọc AI · ${voice.label}`, d: hasVi ? "Xem trước bằng giọng tiếng Việt của trình duyệt" : "Trình duyệt này không có giọng tiếng Việt nên bản xem trước không có tiếng" },
                { icon: MousePointerClick, t: "Nút kêu gọi cuối video", d: "“Bấm giỏ hàng ngay” xuất hiện ở 4 giây cuối" },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFF3EE] text-[#C2410C]">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{t}</span>
                    <span className="block text-xs text-slate-500">{d}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-6">
              <button
                onClick={exportVideo}
                disabled={!ready || exporting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF5722] py-4 text-[17px] font-extrabold text-white shadow-lg shadow-[#FF5722]/30 transition hover:bg-[#E64A19] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                {exporting ? `Đang xuất... ${Math.round((exportProgress ?? 0) * 100)}%` : "Tải file MP4"}
              </button>
              {exportMsg && <p className="mt-2.5 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700">{exportMsg}</p>}
              <p className="mt-2.5 text-[11px] leading-snug text-slate-500">
                Bản demo xuất video ngay trên trình duyệt, mất khoảng {fmt(total)} và <b>chưa kèm giọng đọc</b> (trình duyệt không cho thu giọng đọc mẫu). Bản thật dựng trên
                máy chủ: MP4 1080×1920 có giọng AI, xong trong vài giây.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- VIDEO PRO (giới thiệu) --------------------------- */
function ProModal({ credits, onClose }: { credits: number; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F172A]/80 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Video AI người mẫu"
        onClick={(e) => e.stopPropagation()}
        className="modal-in relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-[#0F172A] text-white shadow-2xl sm:rounded-3xl"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF5722]/30 blur-3xl" />
        <button onClick={onClose} aria-label="Đóng" className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="relative p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 to-[#FF5722] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#0F172A]">
            <Crown className="h-3.5 w-3.5" /> Pro
          </span>
          <h3 className="mt-4 text-2xl font-extrabold tracking-tight">Video AI người mẫu chuyển động thực</h3>
          <p className="mt-2 text-slate-300">Không cần thuê mẫu, không cần quay. AI tạo người mẫu giới thiệu sản phẩm của bạn, nói đúng kịch bản đã chọn.</p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {[
              "Người mẫu AI cầm và giới thiệu sản phẩm từ ảnh bạn tải lên",
              "Khẩu hình và cử chỉ khớp với giọng đọc AI",
              "Video dọc 1080×1920, phụ đề và nút kêu gọi sẵn sàng đăng",
              "Chọn phong cách người mẫu: trẻ trung, công sở, mẹ bỉm sữa",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#FF5722]" />
                <span className="text-slate-200">{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <span className="text-sm text-slate-300">Chi phí mỗi video</span>
            <span className="inline-flex items-center gap-1.5 font-extrabold text-amber-300">
              <Coins className="h-4 w-4" /> {COST.pro} Credits
            </span>
          </div>
          <p className="mt-4 rounded-xl bg-amber-300/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-100 ring-1 ring-amber-300/30">
            Bản demo chưa tạo được video Pro nên không trừ Credit của bạn (ví demo đang có {credits} Credits). Trong bản thật, xác nhận sẽ trừ {COST.pro} Credits và video được gửi về
            sau vài phút.
          </p>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            <a
              href="#bang-gia"
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#FF5722] py-3.5 font-extrabold text-white transition hover:bg-[#E64A19]"
            >
              Xem gói phù hợp <ArrowRight className="h-4 w-4" />
            </a>
            <button onClick={onClose} className="rounded-2xl bg-white/10 py-3.5 font-bold text-white transition hover:bg-white/15">
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- BẢNG GIÁ ----------------------------- */
function Pricing() {
  return (
    <section id="bang-gia" className="scroll-mt-16 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="Bảng giá" title="Trả theo lượt dùng, không gói tháng">
          1 Credit = 1 lần tạo 3 kịch bản kèm giọng đọc. Credit không hết hạn, thanh toán bằng QR ngân hàng, cộng tự động.
        </SectionTitle>

        <div className="mt-14 grid items-stretch gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-3xl p-7 transition ${
                p.popular
                  ? "bg-[#0F172A] text-white shadow-2xl shadow-[#0F172A]/30 md:-translate-y-3"
                  : "border-2 border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-[#FF5722] px-4 py-1.5 text-xs font-extrabold text-white shadow-lg">
                  <Crown className="h-3.5 w-3.5" /> PHỔ BIẾN NHẤT
                </span>
              )}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className={`mt-1 text-sm ${p.popular ? "text-slate-400" : "text-slate-500"}`}>{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">{vnd(p.price)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5722]/15 px-2.5 py-1 font-bold text-[#FF5722]">
                  <Coins className="h-4 w-4" /> {p.credits} Credits
                </span>
                <span className={p.popular ? "text-slate-400" : "text-slate-500"}>≈ {vnd(Math.round(p.price / p.credits))}/Credit</span>
              </div>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#FF5722]" />
                    <span className={p.popular ? "text-slate-200" : "text-slate-700"}>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`${SIGNUP_URL}?plan=${p.id}`}
                className={`mt-8 flex items-center justify-center gap-2 rounded-2xl py-3.5 font-extrabold transition ${
                  p.popular
                    ? "bg-[#FF5722] text-white shadow-lg shadow-[#FF5722]/30 hover:bg-[#E64A19]"
                    : "bg-slate-100 text-[#0F172A] hover:bg-[#0F172A] hover:text-white"
                }`}
              >
                Chọn {p.name.replace("Gói ", "gói ")} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-slate-600">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#FF5722]" /> Thanh toán QR ngân hàng an toàn
          </span>
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#FF5722]" /> Cộng Credit tự động
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#FF5722]" /> Credit không hết hạn
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ HỎI ĐÁP ------------------------------ */
function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="hoi-dap" className="scroll-mt-16 bg-slate-50 py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionTitle eyebrow="Hỏi đáp" title="Câu hỏi thường gặp" />
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={`rounded-2xl border bg-white transition ${isOpen ? "border-[#FF5722]/40 shadow-lg shadow-slate-200/60" : "border-slate-200"}`}>
                <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left" aria-expanded={isOpen}>
                  <span className="font-bold">{f.q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${isOpen ? "rotate-180 text-[#FF5722]" : ""}`} />
                </button>
                {isOpen && <p className="px-6 pb-5 leading-relaxed text-slate-600">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- CTA CUỐI TRANG ---------------------------- */
function FinalCta() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#FF5722] px-6 py-14 text-center text-white sm:px-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#0F172A]/15" />
        <div className="relative">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Video tiếp theo của bạn bắt đầu từ đây</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">Biến mọi sản phẩm thành kịch bản bão đơn trong 60 giây.</p>
          <a
            href="#trai-nghiem"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#0F172A] px-8 py-4 text-base font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-black"
          >
            Dùng thử miễn phí <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- FOOTER ------------------------------- */
function Footer() {
  const cols = [
    { title: "Sản phẩm", links: [["Tính năng", "#tinh-nang"], ["Trải nghiệm", "#trai-nghiem"], ["Bảng giá", "#bang-gia"]] },
    { title: "Hỗ trợ", links: [["Câu hỏi thường gặp", "#hoi-dap"], ["Hướng dẫn nạp Credit", "#bang-gia"], ["Liên hệ", `mailto:${SUPPORT_EMAIL}`]] },
    { title: "Pháp lý", links: [["Điều khoản sử dụng", "/dieu-khoan"], ["Chính sách bảo mật", "/bao-mat"], ["Chính sách hoàn tiền", "/hoan-tien"]] },
  ];
  return (
    <footer className="bg-[#0F172A] text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">Biến mọi sản phẩm thành kịch bản bão đơn trong 60 giây.</p>
          <p className="mt-4 text-sm">
            Email: <span className="text-slate-200">{SUPPORT_EMAIL}</span>
            <br />
            Hotline/Zalo: <span className="text-slate-200">{SUPPORT_PHONE}</span>
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">{c.title}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="transition hover:text-[#FF5722]">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Đơn AI. Bảo lưu mọi quyền.</p>
          <p>TikTok và Shopee là thương hiệu của các chủ sở hữu tương ứng. Đơn AI không liên kết với các nền tảng này.</p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------ DÙNG CHUNG ------------------------------ */
function SectionTitle({ eyebrow, title, children, dark = false }: { eyebrow: string; title: string; children?: ReactNode; dark?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className={`text-sm font-extrabold uppercase tracking-widest ${dark ? "text-[#FF5722]" : "text-[#C2410C]"}`}>{eyebrow}</span>
      <h2 className={`mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl ${dark ? "text-white" : "text-[#0F172A]"}`}>{title}</h2>
      {children && <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>{children}</p>}
    </div>
  );
}

const KEYFRAMES = `
@keyframes fadeUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
.fade-up { animation: fadeUp .7s ease-out both }
@keyframes cardIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
.card-in { animation: cardIn .45s ease-out both }
@keyframes wave { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(.45) } }
.wave { animation: wave .8s ease-in-out infinite; transform-origin: center }
@keyframes floatY { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
.float { animation: floatY 4s ease-in-out infinite }
@keyframes loadingBar { from { width: 0 } to { width: 100% } }
.loading-bar { animation: loadingBar 2s linear forwards }
@keyframes glow { 0%,100% { box-shadow: 0 18px 40px -12px rgba(255,87,34,.55) } 50% { box-shadow: 0 18px 50px -8px rgba(255,87,34,.8) } }
.cta-glow { animation: glow 2.6s ease-in-out infinite }
@keyframes modalIn { from { opacity: 0; transform: translateY(16px) scale(.98) } to { opacity: 1; transform: none } }
.modal-in { animation: modalIn .25s ease-out }
@keyframes pop { 0% { transform: scale(1) } 40% { transform: scale(1.15) } 100% { transform: scale(1) } }
.pop { animation: pop .35s ease-out }
html { scroll-behavior: smooth }
@media (prefers-reduced-motion: reduce) { .fade-up,.card-in,.wave,.float,.cta-glow,.modal-in,.pop { animation: none } }
`;
