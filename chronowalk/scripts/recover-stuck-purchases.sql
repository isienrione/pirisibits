-- Prefer scripts/paddle-customers-migration.sql (creates cache table + unlocks).
-- This file remains as a purchases-only unlock fallback.

INSERT INTO public.purchases (email, order_id, product_id, access_token)
VALUES
  ('ienrione@berkeley.edu', 'txn_01ky16cys102fqcg521m3fj27x', 'rome-essential', 'a24a7a20-e256-4678-a84f-6d3aa344a271'::uuid),
  ('isidora@enrione.com', 'txn_01ky149x1rmtqmbbqzy9bta2pj', 'rome-complete', 'dc5c7ab0-d2bd-41ac-b33f-64bf06ea0164'::uuid),
  ('isienrione@gmail.com', 'txn_01ky12r6yg2s2zcmtz453qegan', 'rome-complete', '62fb18de-85ab-44b0-ab80-945b1472cb71'::uuid)
ON CONFLICT (order_id) DO UPDATE
  SET email = EXCLUDED.email,
      product_id = COALESCE(EXCLUDED.product_id, public.purchases.product_id)
RETURNING order_id, email, product_id, access_token,
  ('https://chronowalk.com/access?token=' || access_token::text) AS unlock_link;
