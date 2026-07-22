-- EXAMPLE ONLY — synthetic placeholders. Never run as a production migration.
-- Prefer scripts/paddle-customers-migration.sql for schema, then a private
-- *.local.sql recovery file for real incidents (gitignored).

INSERT INTO public.purchases (email, order_id, product_id, access_token)
VALUES
  (
    'buyer@example.invalid',
    'txn_EXAMPLE',
    'rome-complete',
    '00000000-0000-4000-8000-000000000000'::uuid
  )
ON CONFLICT (order_id) DO UPDATE
  SET email = EXCLUDED.email,
      product_id = COALESCE(EXCLUDED.product_id, public.purchases.product_id);
