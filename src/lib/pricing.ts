// =====================================================================
// Bảng giá nạp Credit — sửa giá ở đây, không cần đụng database.
// =====================================================================

export const TOPUP_PACKAGES = [
  { amountVnd: 49_000, credits: 15, label: "Gói Dùng thử" },
  { amountVnd: 149_000, credits: 50, label: "Gói Bán chạy" },
  { amountVnd: 299_000, credits: 110, label: "Gói Shop lớn" },
] as const;

// Khách chuyển số tiền KHÔNG khớp gói nào → quy đổi theo giá lẻ (đắt hơn mọi gói,
// để khách có lý do chọn đúng gói). Ví dụ chuyển 100.000đ → 28 credit.
export const RETAIL_PRICE_PER_CREDIT = 3_500;

export const TOPUP_PREFIX = "NAPTIEN";

export function creditsForAmount(amountVnd: number): { credits: number; note: string } {
  const pkg = TOPUP_PACKAGES.find((p) => p.amountVnd === amountVnd);
  if (pkg) return { credits: pkg.credits, note: pkg.label };

  const credits = Math.floor(amountVnd / RETAIL_PRICE_PER_CREDIT);
  if (credits > 0) {
    return { credits, note: `Không khớp gói, quy đổi giá lẻ ${RETAIL_PRICE_PER_CREDIT}đ/credit` };
  }
  return { credits: 0, note: "Số tiền quá nhỏ — cần xử lý thủ công" };
}
