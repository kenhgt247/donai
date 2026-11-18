// =====================================================================
// API Route: POST /api/payment-webhook  (nhận tín hiệu từ SePay)
//
// Khách quét QR, chuyển khoản với nội dung:  NAPTIEN <MÃ NẠP>   (vd: NAPTIEN K7X2M9QA)
// SePay thấy tiền vào tài khoản → gọi webhook này → ta cộng credit tự động.
//
// Luồng: (1) Xác thực API Key → (2) Đọc mã nạp trong nội dung CK
//        → (3) Quy đổi tiền ra credit → (4) Ghi Transactions + cộng credit (chống trùng)
//
// 🔑 Cần điền trong .env.local:
//    SEPAY_WEBHOOK_API_KEY  — chuỗi bí mật BẠN TỰ ĐẶT, nhập y hệt vào ô "API Key"
//                             khi tạo webhook trên my.sepay.vn
//    SEPAY_ACCOUNT_NUMBER   — số tài khoản ngân hàng nhận tiền của bạn
// =====================================================================

import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { creditsForAmount, TOPUP_PREFIX } from "@/lib/pricing";

export const runtime = "nodejs";

// Dữ liệu SePay gửi sang (các trường dùng tới)
type SepayPayload = {
  id: number; // mã giao dịch phía SePay — dùng để chống trùng
  gateway: string; // tên ngân hàng
  transactionDate: string;
  accountNumber: string; // tài khoản nhận tiền
  content: string; // nội dung chuyển khoản
  transferType: "in" | "out";
  transferAmount: number;
  referenceCode: string; // mã tham chiếu của ngân hàng
};

// SePay chỉ coi là THÀNH CÔNG khi nhận HTTP 200/201 + {"success": true}.
// Trả lỗi khác → SePay gửi lại. Vì vậy:
//  - Giao dịch không liên quan / đã xử lý → vẫn trả success (để SePay khỏi gửi lại vô ích)
//  - Lỗi database tạm thời → trả 500 (để SePay gửi lại sau)
const ok = (extra: Record<string, unknown> = {}) =>
  NextResponse.json({ success: true, ...extra }, { status: 200 });

// Mã nạp: 8 ký tự chữ in hoa/số. Cho phép có hoặc không có dấu cách sau NAPTIEN,
// vì một số ngân hàng tự xoá dấu cách.
const CODE_REGEX = new RegExp(`${TOPUP_PREFIX}\\s*([A-Z0-9]{8})`, "i");

export async function POST(req: Request) {
  // -------------------------------------------------------------------
  // BƯỚC 1: Xác thực — header "Authorization: Apikey <KEY>"
  // -------------------------------------------------------------------
  const expectedKey = process.env.SEPAY_WEBHOOK_API_KEY;
  if (!expectedKey) {
    console.error("[payment-webhook] Chưa cấu hình SEPAY_WEBHOOK_API_KEY");
    return NextResponse.json({ success: false }, { status: 500 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const receivedKey = auth.startsWith("Apikey ") ? auth.slice("Apikey ".length).trim() : "";
  if (!safeEqual(receivedKey, expectedKey)) {
    console.warn("[payment-webhook] Sai API Key — có thể là request giả mạo");
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as SepayPayload | null;
  if (!payload || typeof payload.id !== "number" || typeof payload.transferAmount !== "number") {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }

  // Chỉ xử lý tiền VÀO đúng tài khoản của mình
  if (payload.transferType !== "in") return ok({ ignored: "not_incoming" });

  const myAccount = process.env.SEPAY_ACCOUNT_NUMBER;
  if (myAccount && payload.accountNumber !== myAccount) {
    console.warn("[payment-webhook] Sai tài khoản nhận:", payload.accountNumber);
    return ok({ ignored: "wrong_account" });
  }

  // -------------------------------------------------------------------
  // BƯỚC 2: Đọc mã nạp từ nội dung chuyển khoản
  // -------------------------------------------------------------------
  const match = CODE_REGEX.exec(payload.content ?? "");
  if (!match) {
    // Tiền vào nhưng không có cú pháp NAPTIEN (vd: khách chuyển nhầm nội dung)
    console.warn("[payment-webhook] Không tìm thấy mã nạp:", payload.id, payload.content);
    return ok({ ignored: "no_topup_code" });
  }
  const paymentCode = match[1].toUpperCase();

  // -------------------------------------------------------------------
  // BƯỚC 3: Quy đổi số tiền → credit (bảng giá ở src/lib/pricing.ts)
  // -------------------------------------------------------------------
  const amount = Math.round(payload.transferAmount);
  const { credits, note } = creditsForAmount(amount);

  // -------------------------------------------------------------------
  // BƯỚC 4: Ghi Transactions + cộng credit — một lệnh duy nhất trong database.
  // provider_ref = "sepay:<id>" là UNIQUE → webhook gửi lại bao nhiêu lần cũng chỉ cộng 1 lần.
  // -------------------------------------------------------------------
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("credit_bank_transfer", {
    p_provider: "sepay",
    p_provider_ref: `sepay:${payload.id}`,
    p_payment_code: paymentCode,
    p_amount_vnd: amount,
    p_credits: credits,
    p_note: note,
    p_raw: payload,
  });

  if (error) {
    console.error("[payment-webhook] Lỗi database:", error);
    return NextResponse.json({ success: false }, { status: 500 }); // SePay sẽ gửi lại
  }

  const result = data as { status: string; user_id?: string; credits_added?: number; balance?: number };

  switch (result.status) {
    case "credited":
      console.info(
        `[payment-webhook] +${result.credits_added} credit cho ${result.user_id} (số dư ${result.balance})`
      );
      break;
    case "duplicate":
      console.info("[payment-webhook] Webhook gửi lại, đã bỏ qua:", payload.id);
      break;
    case "needs_review":
      console.warn("[payment-webhook] Số tiền không quy đổi được, cần xử lý tay:", payload.id, amount);
      break;
    case "user_not_found":
      console.warn("[payment-webhook] Mã nạp không tồn tại:", paymentCode, payload.id);
      break;
  }

  return ok({ status: result.status });
}

// So sánh chuỗi bí mật với thời gian không đổi (chống đoán key qua thời gian phản hồi)
function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
