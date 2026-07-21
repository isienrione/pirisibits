-- ChronoWalk: cache Paddle customer emails from customer.created webhooks.
-- transaction.completed only has customer_id — never email.
-- Run this in Supabase → SQL Editor, then redeploy paddle-webhook.
--
-- Do NOT commit real customer backfills. For a synthetic operational example, see:
--   scripts/paddle-customers-backfill.example.sql
-- That example file must never be run as a production migration.

create table if not exists public.paddle_customers (
  customer_id text primary key,
  email text not null,
  updated_at timestamptz not null default now()
);

create index if not exists paddle_customers_email_idx
  on public.paddle_customers (email);

alter table public.paddle_customers enable row level security;

drop policy if exists "paddle_customers service only" on public.paddle_customers;
create policy "paddle_customers service only"
  on public.paddle_customers for all
  to service_role
  using (true)
  with check (true);
