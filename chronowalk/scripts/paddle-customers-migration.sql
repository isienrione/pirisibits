-- ChronoWalk: cache Paddle customer emails from customer.created webhooks.
-- transaction.completed only has customer_id — never email.
-- Run this in Supabase → SQL Editor, then redeploy paddle-webhook (v5).

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

-- Backfill from known live test checkouts (customer.created already fired; we ignored it)
insert into public.paddle_customers (customer_id, email)
values
  ('ctm_01ky16dftah2hv211jb2z8rbnp', 'ienrione@berkeley.edu'),
  ('ctm_01ky12h2yhzygs7c4v1sv95vq7', 'isidora@enrione.com'),
  ('ctm_01ky12rtj0g7vjx1a4za405gfz', 'isienrione@gmail.com')
on conflict (customer_id) do update
  set email = excluded.email,
      updated_at = now();

-- Unlock stuck purchases immediately (webhook retries will also succeed after v5 + backfill)
insert into public.purchases (email, order_id, product_id, access_token)
values
  ('ienrione@berkeley.edu', 'txn_01ky16cys102fqcg521m3fj27x', 'rome-essential', 'a24a7a20-e256-4678-a84f-6d3aa344a271'::uuid),
  ('isidora@enrione.com', 'txn_01ky149x1rmtqmbbqzy9bta2pj', 'rome-complete', 'dc5c7ab0-d2bd-41ac-b33f-64bf06ea0164'::uuid),
  ('isienrione@gmail.com', 'txn_01ky12r6yg2s2zcmtz453qegan', 'rome-complete', '62fb18de-85ab-44b0-ab80-945b1472cb71'::uuid)
on conflict (order_id) do update
  set email = excluded.email,
      product_id = coalesce(excluded.product_id, public.purchases.product_id)
returning order_id, email, product_id, access_token,
  ('https://chronowalk.com/access?token=' || access_token::text) as unlock_link;
