-- Run this in the Supabase SQL Editor. Server functions access this table with service-role key only.
create table if not exists public.chat_messages (
  id uuid primary key,
  session_id uuid not null,
  sender text not null check (sender in ('user','bot','admin')),
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_session_created_idx on public.chat_messages(session_id, created_at);
alter table public.chat_messages enable row level security;
-- Do not create public policies. Browser access must go through the serverless API.
