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
