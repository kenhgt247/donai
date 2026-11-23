-- ĐƠN AI — TẤT CẢ TRONG 1 FILE (gộp 0001 → 0005)
-- Chỉ chạy 1 lần trên project Supabase MỚI: SQL Editor → dán toàn bộ → Run.
-- Đã chạy từng file 0001…0005 rồi thì KHÔNG chạy file này nữa.

-- ===================== 0001_init.sql =====================
-- =====================================================================
-- [Tên App] — Supabase schema v1 (MVP)
-- Chạy 1 lần trong Supabase Dashboard → SQL Editor
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Hàm dùng chung: tự cập nhật updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 1. USERS (profiles) — mở rộng auth.users, lưu số dư credit
-- =====================================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  credits     integer not null default 0 check (credits >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Tự tạo profile + tặng credit dùng thử khi user đăng ký
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, credits)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 5); -- 5 credit free
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 2. PROJECTS — lịch sử kịch bản + file giọng đọc
-- =====================================================================
create type public.project_status as enum ('draft', 'script_ready', 'audio_ready', 'failed');

create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  platform      text not null default 'tiktok'
                  check (platform in ('tiktok', 'shopee', 'other')),
  -- Thông tin sản phẩm user nhập: {name, price, features[], audience, link, ...}
  product_info  jsonb not null default '{}'::jsonb,
  tone          text,                                   -- hài hước, chuyên gia, review chân thật...
  duration_sec  integer check (duration_sec between 10 and 180),
  script        text,                                   -- kịch bản AI tạo ra
  tts_provider  text check (tts_provider in ('vbee', 'elevenlabs')),
  voice_id      text,
  audio_path    text,                                   -- đường dẫn trong Storage bucket 'audio'
  credits_used  integer not null default 0 check (credits_used >= 0),
  status        public.project_status not null default 'draft',
  error_message text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_projects_user_created on public.projects (user_id, created_at desc);

create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 3. TRANSACTIONS — lịch sử nạp tiền (PayOS / SePay)
-- =====================================================================
create type public.tx_status as enum ('pending', 'paid', 'failed', 'expired');

create table public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  provider      text not null check (provider in ('payos', 'sepay')),
  -- Mã đơn dạng số (PayOS yêu cầu orderCode là số; SePay dùng làm nội dung CK, vd "NAP100123")
  order_code    bigint generated always as identity (start with 100000) unique,
  amount_vnd    integer not null check (amount_vnd > 0),
  credits       integer not null check (credits > 0),
  status        public.tx_status not null default 'pending',
  provider_ref  text unique,          -- mã giao dịch ngân hàng → chống cộng tiền 2 lần
  raw_webhook   jsonb,                -- lưu nguyên payload để đối soát
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_tx_user_created on public.transactions (user_id, created_at desc);

-- =====================================================================
-- 4. HÀM XỬ LÝ CREDIT (chỉ server gọi bằng service_role)
-- =====================================================================

-- Trừ credit nguyên tử: không bao giờ âm, không bị race condition
create or replace function public.spend_credits(p_user uuid, p_amount integer)
returns integer language plpgsql security definer set search_path = public as $$
declare v_left integer;
begin
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;

  update public.profiles
     set credits = credits - p_amount
   where id = p_user and credits >= p_amount
  returning credits into v_left;

  if not found then raise exception 'INSUFFICIENT_CREDITS'; end if;
  return v_left;
end;
$$;

-- Hoàn credit khi gọi AI/TTS thất bại
create or replace function public.refund_credits(p_user uuid, p_amount integer)
returns integer language plpgsql security definer set search_path = public as $$
declare v_left integer;
begin
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  update public.profiles set credits = credits + p_amount
   where id = p_user returning credits into v_left;
  return v_left;
end;
$$;

-- Xác nhận thanh toán từ webhook — idempotent (webhook gửi lại nhiều lần vẫn an toàn)
create or replace function public.confirm_payment(
  p_order_code bigint,
  p_amount_vnd integer,
  p_provider_ref text,
  p_raw jsonb
)
returns boolean language plpgsql security definer set search_path = public as $$
declare tx public.transactions%rowtype;
begin
  select * into tx from public.transactions
   where order_code = p_order_code
   for update;                                   -- khoá dòng, chống 2 webhook song song

  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if tx.status = 'paid' then return false; end if;           -- đã xử lý rồi → bỏ qua
  if p_amount_vnd < tx.amount_vnd then raise exception 'AMOUNT_MISMATCH'; end if;

  update public.transactions
     set status = 'paid', paid_at = now(),
         provider_ref = p_provider_ref, raw_webhook = p_raw
   where id = tx.id;

  update public.profiles
     set credits = credits + tx.credits
   where id = tx.user_id;

  return true;
end;
$$;

-- Khoá quyền: trình duyệt (anon/authenticated) KHÔNG được gọi các hàm tiền
revoke execute on function public.spend_credits(uuid, integer)   from public, anon, authenticated;
revoke execute on function public.refund_credits(uuid, integer)  from public, anon, authenticated;
revoke execute on function public.confirm_payment(bigint, integer, text, jsonb) from public, anon, authenticated;
grant  execute on function public.spend_credits(uuid, integer)   to service_role;
grant  execute on function public.refund_credits(uuid, integer)  to service_role;
grant  execute on function public.confirm_payment(bigint, integer, text, jsonb) to service_role;

-- =====================================================================
-- 5. ROW LEVEL SECURITY — user chỉ ĐỌC được dữ liệu của chính mình.
--    Mọi thao tác GHI đi qua API route phía server (service_role).
-- =====================================================================
alter table public.profiles     enable row level security;
alter table public.projects     enable row level security;
alter table public.transactions enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

create policy "projects: read own" on public.projects
  for select using (auth.uid() = user_id);

create policy "projects: delete own" on public.projects
  for delete using (auth.uid() = user_id);

create policy "transactions: read own" on public.transactions
  for select using (auth.uid() = user_id);

-- =====================================================================
-- 6. STORAGE — bucket riêng tư cho file giọng đọc
--    Đường dẫn file: audio/{user_id}/{project_id}.mp3
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do nothing;

create policy "audio: read own files" on storage.objects
  for select using (
    bucket_id = 'audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===================== 0002_vieneu_variants.sql =====================
-- Bổ sung cho VieNeu-TTS + 3 kịch bản mỗi lần tạo
-- Chạy sau 0001_init.sql trong Supabase SQL Editor

-- Lưu 3 kịch bản: [{ "hook": "...", "body": "...", "cta": "...", "audio_path": "..." }, ...]
alter table public.projects
  add column if not exists variants jsonb not null default '[]'::jsonb;

-- Cho phép nhà cung cấp giọng đọc 'vieneu'
alter table public.projects drop constraint if exists projects_tts_provider_check;
alter table public.projects
  add constraint projects_tts_provider_check
  check (tts_provider in ('vieneu', 'vbee', 'elevenlabs'));

-- ===================== 0003_bank_transfer_topup.sql =====================
-- =====================================================================
-- 0003 — Nạp tiền bằng chuyển khoản QR (SePay), nội dung "NAPTIEN <MÃ>"
-- Chạy sau 0001 và 0002 trong Supabase SQL Editor
-- =====================================================================

-- 1. Mã nạp tiền ngắn cho từng người dùng (8 ký tự, bỏ các ký tự dễ nhầm 0/O/1/I)
--    Không dùng thẳng UUID vì ngân hàng hay cắt bớt / xoá dấu "-" trong nội dung chuyển khoản.
create or replace function public.gen_payment_code()
returns text language sql volatile as $$
  select string_agg(
           substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 32) + 1)::int, 1), ''
         )
  from generate_series(1, 8);
$$;

alter table public.profiles
  add column if not exists payment_code text unique default public.gen_payment_code();

update public.profiles set payment_code = public.gen_payment_code() where payment_code is null;
alter table public.profiles alter column payment_code set not null;

-- 2. Transactions: cho phép ghi nhận giao dịch 0 credit (sai số tiền → chờ xử lý tay) + ghi chú
alter table public.transactions drop constraint if exists transactions_credits_check;
alter table public.transactions add constraint transactions_credits_check check (credits >= 0);
alter table public.transactions add column if not exists note text;

-- 3. Hàm cộng credit từ chuyển khoản — chạy trọn gói trong 1 transaction của database
--    Chống cộng trùng: provider_ref là UNIQUE → webhook gửi lại lần 2 sẽ bị "on conflict do nothing"
create or replace function public.credit_bank_transfer(
  p_provider     text,
  p_provider_ref text,
  p_payment_code text,
  p_amount_vnd   integer,
  p_credits      integer,
  p_note         text,
  p_raw          jsonb
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user    uuid;
  v_tx_id   uuid;
  v_balance integer;
begin
  select id into v_user from public.profiles where payment_code = upper(p_payment_code);
  if v_user is null then
    return jsonb_build_object('status', 'user_not_found');
  end if;

  insert into public.transactions
    (user_id, provider, amount_vnd, credits, status, provider_ref, raw_webhook, paid_at, note)
  values
    (v_user, p_provider, p_amount_vnd, p_credits,
     case when p_credits > 0 then 'paid'::public.tx_status else 'failed'::public.tx_status end,
     p_provider_ref, p_raw, now(), p_note)
  on conflict (provider_ref) do nothing
  returning id into v_tx_id;

  if v_tx_id is null then
    return jsonb_build_object('status', 'duplicate');   -- đã xử lý trước đó → không cộng nữa
  end if;

  if p_credits > 0 then
    update public.profiles set credits = credits + p_credits
     where id = v_user
    returning credits into v_balance;
  end if;

  return jsonb_build_object(
    'status', case when p_credits > 0 then 'credited' else 'needs_review' end,
    'user_id', v_user,
    'credits_added', p_credits,
    'balance', v_balance
  );
end;
$$;

revoke execute on function public.credit_bank_transfer(text, text, text, integer, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.credit_bank_transfer(text, text, text, integer, integer, text, jsonb)
  to service_role;

-- ===================== 0004_video_jobs.sql =====================
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

-- ===================== 0005_video_watermark.sql =====================
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
