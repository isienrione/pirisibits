-- Additive fulfillment fields for price-derived claims / out-of-order events.
-- Run after 20260721_launch_commerce_hardening.sql (non-production first).

alter table public.purchases
  add column if not exists last_event_occurred_at timestamptz;

alter table public.fulfillment_outbox
  add column if not exists encrypted_claim text;

alter table public.fulfillment_outbox
  add column if not exists claim_expires_at timestamptz;

alter table public.paddle_webhook_events
  add column if not exists operator_review boolean not null default false;

create index if not exists purchases_last_event_occurred_at_idx
  on public.purchases (last_event_occurred_at desc nulls last);
