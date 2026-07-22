-- EXAMPLE ONLY — synthetic placeholders. Never run as a production migration.
-- Copy to a private *.local.sql / *.private.sql file (gitignored) for real ops.

-- Synthetic paddle_customers backfill
insert into public.paddle_customers (customer_id, email)
values
  ('ctm_EXAMPLE_BUYER_001', 'buyer@example.invalid'),
  ('ctm_EXAMPLE_BUYER_002', 'partner@example.invalid')
on conflict (customer_id) do update
  set email = excluded.email,
      updated_at = now();

-- Synthetic purchases unlock (example token is not a real credential)
insert into public.purchases (email, order_id, product_id, access_token)
values
  (
    'buyer@example.invalid',
    'txn_EXAMPLE',
    'rome-essential',
    '00000000-0000-4000-8000-000000000000'::uuid
  )
on conflict (order_id) do update
  set email = excluded.email,
      product_id = coalesce(excluded.product_id, public.purchases.product_id);
