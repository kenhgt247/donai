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
