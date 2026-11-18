-- ==============================================================
-- Phase 1 — settings-driven storefront fixes (non-destructive)
-- ==============================================================
-- Run in the Supabase SQL Editor after db/admin-dashboard.sql.
-- Every statement is additive or idempotent:
--   * no DROP statements
--   * no UPDATE of existing rows
--   * site_settings rows are inserted only when the key is absent
--
-- This migration supplies the keys used by the Phase 1 offer/discount/returns
-- settings. Existing values are never overwritten.

create extension if not exists pgcrypto;

-- The table should already exist from db/admin-dashboard.sql. Keeping the
-- create statement here makes this file safe to run on a fresh project.
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- Store details (defaults only; existing rows are preserved).
insert into public.site_settings (key, value, updated_at) values
  ('store_name', 'Rung E Bahar', now()),
  ('contact_email', 'rungebahar@gmail.com', now()),
  ('contact_phone', '+447476469395', now()),
  ('shipping_text', 'Free worldwide delivery on every order. Dispatch takes 3–5 working days, with made-to-order stitching adding 7–10 days.', now())
on conflict (key) do nothing;

-- Storefront messages and campaign controls added in Phase 1.
insert into public.site_settings (key, value, updated_at) values
  ('announcement_bar_text', 'Free Worldwide Delivery on All Orders | Made-to-Order Stitching Available', now()),
  ('offer_enabled', 'true', now()),
  ('offer_end_date', '', now()),
  ('discount_code', 'REB10', now()),
  ('discount_percent', '10', now()),
  ('returns_text', $returns$
## Cancelling your order
Changed your mind right after ordering? Contact us within 12 hours of placing your order and we will cancel it before it ships. Once an order has been dispatched it can no longer be cancelled.

## Defective or damaged items
If your item arrives defective or damaged, contact us with your order number and photos of the issue. After we verify it, we will offer a refund or a replacement — whichever you prefer.

## No change-of-mind returns or exchanges
Because our pieces are made to order, we do not offer change-of-mind returns, refunds or exchanges. Please double-check your size, colour and details before placing your order — see our Size Chart or contact us if you need help choosing.

## Return shipping
If you do need to return an item (for example, an approved defective or damaged item), the buyer pays the return shipping cost. We recommend using a tracked service.

## Wrong address
We are not responsible for non-delivery caused by an incorrect or incomplete shipping address entered at checkout, and no refund can be issued in that case. Please contact us as soon as you notice an address mistake — if the parcel has not shipped yet, we can update it.
$returns$, now())
on conflict (key) do nothing;

-- Keep the same lockdown posture as db/admin-dashboard.sql. Safe to re-run.
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant select, insert, update, delete on public.site_settings to service_role;

-- Small performance additions identified in the Phase 1 audit.
create index if not exists idx_occasions_featured_slug
  on public.occasions (featured_slug);
create index if not exists idx_admin_audit_entity
  on public.admin_audit_log (entity, entity_id);
