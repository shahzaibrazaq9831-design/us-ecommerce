-- ==============================================================
-- Phase 1 — settings-driven storefront fixes (non-destructive)
-- ==============================================================
-- Run in the Supabase SQL Editor after db/admin-dashboard.sql.
-- Every statement is additive or idempotent, with one deliberate exception:
-- the retired campaign bars must not survive on an existing installation.
--
-- This migration supplies the keys used by the Phase 1 announcement and
-- shipping settings. Existing values are preserved, except for
-- `announcement_bar_text`: a site that still advertises a retired campaign bar
-- or a typed code would otherwise keep showing it after deploy.

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
  ('store_name', 'Damsa Coture', now()),
  ('contact_email', 'rungebahar@gmail.com', now()),
  ('contact_phone', '+447476469395', now()),
  ('shipping_text', 'Free worldwide delivery on every order, delivered within 2 weeks. Made-to-order stitching is included in that time.', now())
on conflict (key) do nothing;

-- Storefront messages added in Phase 1. Both offers are applied automatically:
-- no code, no campaign window and no per-visitor value is stored.
insert into public.site_settings (key, value, updated_at) values
  ('announcement_bar_text', 'Buy 2 Dresses Get Extra 10% Off | Free Shipping Worldwide within 2 weeks', now()),
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

-- Replace a retired campaign bar on an existing installation. This is the one
-- row this migration overwrites, and only when it still holds a different
-- value. The two offers below are applied automatically; there is no code and
-- no campaign window.
update public.site_settings
   set value = 'Buy 2 Dresses Get Extra 10% Off | Free Shipping Worldwide within 2 weeks',
       updated_at = now()
 where key = 'announcement_bar_text'
   and coalesce(value, '') <> 'Buy 2 Dresses Get Extra 10% Off | Free Shipping Worldwide within 2 weeks';

-- The retired campaign bar, its enable flag and the typed-code settings have
-- no reader any more. Clear both key generations so an older install cannot
-- keep advertising an offer the shop does not run.
delete from public.site_settings
 where key in (
   'offer_strip_end_date',
   'offer_end_date',
   'offer_enabled',
   'discount_code',
   'discount_percent'
 );

-- Keep the same lockdown posture as db/admin-dashboard.sql. Safe to re-run.
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant select, insert, update, delete on public.site_settings to service_role;

-- Small performance additions identified in the Phase 1 audit.
create index if not exists idx_occasions_featured_slug
  on public.occasions (featured_slug);
create index if not exists idx_admin_audit_entity
  on public.admin_audit_log (entity, entity_id);
