import { createBrowserClient } from "@supabase/ssr";

// Supabase client chạy trên trình duyệt (anon key + phiên đăng nhập của người dùng)
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
