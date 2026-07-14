-- Add product_id for Lemon checkout[custom][product_id] (rome-central / essential / complete)
alter table public.purchases
  add column if not exists product_id text;

create index if not exists purchases_product_id_idx on public.purchases (product_id);
