-- 0006 — Sửa cảnh báo bảo mật của Supabase (chạy sau 0005)
alter function public.set_updated_at() set search_path = public;
alter function public.gen_payment_code() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
