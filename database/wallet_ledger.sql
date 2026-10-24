-- Server-side demo-credit ledger for Telegram admin actions.
-- Run in Supabase SQL Editor. These are DEMO credits only, not real-money funds.
create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  amount integer not null check (amount <> 0),
  entry_type text not null check (entry_type in ('deposit_approved','admin_manual_add')),
  reference_id text not null unique,
  reason text not null default '',
  admin_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists wallet_ledger_email_created_idx on public.wallet_ledger(email, created_at desc);
alter table public.wallet_ledger enable row level security;

-- Atomically mark a pending request and add a ledger entry exactly once.
create or replace function public.admin_decide_demo_deposit(p_request_id uuid, p_decision text, p_admin_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.deposit_requests%rowtype; ledgerid uuid;
begin
  if p_decision not in ('approved','rejected') then return jsonb_build_object('ok',false,'error','invalid decision'); end if;
  update public.deposit_requests set status=p_decision, decided_at=now()
    where id=p_request_id and status='pending' returning * into r;
  if not found then return jsonb_build_object('ok',false,'error','already handled or missing'); end if;
  if p_decision='approved' then
    insert into public.wallet_ledger(email,amount,entry_type,reference_id,reason,admin_id)
      values(lower(r.email),r.amount,'deposit_approved','deposit:'||r.id::text,'Telegram-approved demo deposit',p_admin_id)
      on conflict(reference_id) do nothing returning id into ledgerid;
    if ledgerid is null then
      return jsonb_build_object('ok',false,'error','duplicate ledger reference');
    end if;
  end if;
  return jsonb_build_object('ok',true,'status',p_decision,'ledger_id',ledgerid);
end; $$;

-- Admin-only manual demo credit. A unique reference makes retries idempotent.
create or replace function public.admin_add_demo_credits(p_email text, p_amount integer, p_reason text, p_admin_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ledgerid uuid; ref text;
begin
  if p_email is null or position('@' in p_email)=0 then raise exception 'invalid email'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 100000 then raise exception 'amount must be 1–100000'; end if;
  ref := 'manual:'||gen_random_uuid()::text;
  insert into public.wallet_ledger(email,amount,entry_type,reference_id,reason,admin_id)
    values(lower(p_email),p_amount,'admin_manual_add',ref,coalesce(nullif(left(p_reason,120),''),'Admin manual demo credit'),p_admin_id)
    returning id into ledgerid;
  return jsonb_build_object('ok',true,'ledger_id',ledgerid,'email',lower(p_email),'amount',p_amount);
end; $$;

-- Service-role-only execution. Never expose the service role key in browser code.
revoke all on function public.admin_decide_demo_deposit(uuid,text,text) from public, anon, authenticated;
revoke all on function public.admin_add_demo_credits(text,integer,text,text) from public, anon, authenticated;
grant execute on function public.admin_decide_demo_deposit(uuid,text,text) to service_role;
grant execute on function public.admin_add_demo_credits(text,integer,text,text) to service_role;
