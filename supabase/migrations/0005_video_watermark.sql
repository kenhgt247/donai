-- =====================================================================
-- 0005 — Logo "Đơn AI" trên video chỉ dành cho khách CHƯA từng nạp tiền
-- Chạy sau 0004 trong Supabase SQL Editor
-- =====================================================================

-- Mỗi yêu cầu dựng video ghi rõ có chèn logo hay không (API quyết định lúc tạo)
alter table public.video_jobs
  add column if not exists watermark boolean not null default true;

-- Khách đã từng nạp tiền thành công chưa?
create or replace function public.has_paid(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.transactions where user_id = p_user and status = 'paid' and credits > 0);
$$;

revoke execute on function public.has_paid(uuid) from public, anon, authenticated;
grant execute on function public.has_paid(uuid) to service_role;
