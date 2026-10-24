-- Run this in the Supabase SQL Editor before deploying.
create table if not exists public.deposit_requests (
  id uuid primary key,
  email text not null,
  amount integer not null check (amount >= 50 and amount <= 100000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- Only Vercel server functions should access this table using the service-role key.
-- Never put SUPABASE_SERVICE_ROLE_KEY or Telegram bot token in frontend JavaScript.
alter table public.deposit_requests enable row level security;
