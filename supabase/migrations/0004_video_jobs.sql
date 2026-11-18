-- =====================================================================
-- 0004 — Hàng đợi dựng video trên máy chủ
-- Chạy sau 0001–0003 trong Supabase SQL Editor
-- =====================================================================

-- 1. Kho lưu ảnh sản phẩm khách tải lên + video đã dựng (đều riêng tư)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('videos', 'videos', false, 209715200, array['video/mp4'])
on conflict (id) do nothing;

-- Khách tự tải ảnh lên thẳng từ trình duyệt, nhưng chỉ vào thư mục của chính mình: photos/<user_id>/...
create policy "photos: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos: read own" on storage.objects
  for select using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos: delete own" on storage.objects
  for delete using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "videos: read own" on storage.objects
  for select using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Bảng việc cần dựng
create type public.video_job_status as enum ('queued', 'processing', 'done', 'failed');

create table public.video_jobs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  variant_index   smallint not null check (variant_index between 0 and 2),
  kind            text not null default 'review' check (kind in ('review', 'pro')),
  photo_paths     text[] not null check (array_length(photo_paths, 1) between 3 and 5),
  credits_charged integer not null check (credits_charged >= 0),
  status          public.video_job_status not null default 'queued',
  progress        smallint not null default 0 check (progress between 0 and 100),
  video_path      text,
  error_message   text,
  refunded        boolean not null default false,
  attempts        smallint not null default 0,
  locked_by       text,
  locked_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  finished_at     timestamptz
);

create index idx_video_jobs_queue on public.video_jobs (created_at) where status in ('queued', 'processing');
create index idx_video_jobs_user on public.video_jobs (user_id, created_at desc);
create index idx_video_jobs_reuse on public.video_jobs (project_id, variant_index) where status = 'done';

create trigger trg_video_jobs_updated
  before update on public.video_jobs
  for each row execute function public.set_updated_at();

alter table public.video_jobs enable row level security;
create policy "video_jobs: read own" on public.video_jobs
  for select using (auth.uid() = user_id);

-- 3. Worker nhận việc: lấy 1 việc đang chờ (hoặc việc bị treo > 10 phút, tối đa 3 lần thử)
--    "for update skip locked" → nhiều worker chạy song song không bao giờ nhận trùng việc
create or replace function public.claim_video_job(p_worker text)
returns setof public.video_jobs language plpgsql security definer set search_path = public as $$
begin
  return query
  update public.video_jobs j
     set status = 'processing', locked_by = p_worker, locked_at = now(), attempts = j.attempts + 1
   where j.id = (
     select id from public.video_jobs
      where (status = 'queued')
         or (status = 'processing' and locked_at < now() - interval '10 minutes' and attempts < 3)
      order by created_at
      for update skip locked
      limit 1)
  returning j.*;
end;
$$;

create or replace function public.set_video_job_progress(p_id uuid, p_progress integer)
returns void language sql security definer set search_path = public as $$
  update public.video_jobs
     set progress = greatest(progress, least(99, p_progress))
   where id = p_id and status = 'processing';
$$;

create or replace function public.complete_video_job(p_id uuid, p_video_path text)
returns void language sql security definer set search_path = public as $$
  update public.video_jobs
     set status = 'done', progress = 100, video_path = p_video_path, finished_at = now(), error_message = null
   where id = p_id;
$$;

-- Thất bại → hoàn credit đúng 1 lần (khoá dòng để 2 worker không hoàn trùng)
create or replace function public.fail_video_job(p_id uuid, p_error text)
returns void language plpgsql security definer set search_path = public as $$
declare j public.video_jobs%rowtype;
begin
  select * into j from public.video_jobs where id = p_id for update;
  if not found or j.status = 'done' then return; end if;

  update public.video_jobs
     set status = 'failed', error_message = p_error, finished_at = now(), refunded = true
   where id = p_id;

  if not j.refunded and j.credits_charged > 0 then
    update public.profiles set credits = credits + j.credits_charged where id = j.user_id;
  end if;
end;
$$;

-- Việc treo đã thử 3 lần → coi là thất bại và hoàn credit (chạy định kỳ hoặc trong worker)
create or replace function public.fail_stuck_video_jobs()
returns integer language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  for r in
    select id from public.video_jobs
     where status = 'processing' and locked_at < now() - interval '10 minutes' and attempts >= 3
  loop
    perform public.fail_video_job(r.id, 'Quá thời gian xử lý sau 3 lần thử');
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Chỉ máy chủ (service_role) được gọi các hàm này
revoke execute on function public.claim_video_job(text) from public, anon, authenticated;
revoke execute on function public.set_video_job_progress(uuid, integer) from public, anon, authenticated;
revoke execute on function public.complete_video_job(uuid, text) from public, anon, authenticated;
revoke execute on function public.fail_video_job(uuid, text) from public, anon, authenticated;
revoke execute on function public.fail_stuck_video_jobs() from public, anon, authenticated;
grant execute on function public.claim_video_job(text) to service_role;
grant execute on function public.set_video_job_progress(uuid, integer) to service_role;
grant execute on function public.complete_video_job(uuid, text) to service_role;
grant execute on function public.fail_video_job(uuid, text) to service_role;
grant execute on function public.fail_stuck_video_jobs() to service_role;
