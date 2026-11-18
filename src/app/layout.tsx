import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

// Font chính của thương hiệu Đơn AI — hỗ trợ tiếng Việt đầy đủ
const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Đơn AI – Kịch bản video bán hàng & giọng đọc AI trong 60 giây",
  description:
    "Biến mọi sản phẩm thành kịch bản bão đơn trong 60 giây. Tạo 3 kịch bản TikTok Shop, Shopee Video kèm giọng đọc AI tiếng Việt.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className={beVietnam.className}>{children}</body>
    </html>
  );
}
