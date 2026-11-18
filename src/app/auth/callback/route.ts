import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Người dùng bấm link trong email đăng nhập → Supabase chuyển về đây kèm "code"
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  // Chỉ cho chuyển tiếp trong chính trang web (chống chuyển hướng ra ngoài)
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
