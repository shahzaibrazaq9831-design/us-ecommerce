-- ==============================================================
-- Admin dashboard schema (Supabase SQL Editor)
-- ==============================================================
-- Run this once in the Supabase project used by NEXT_PUBLIC_SUPABASE_URL.
-- It is safe to re-run: every statement is idempotent.
--
-- WHY THIS FILE EXISTS
-- --------------------
-- The current Supabase project has NONE of the tables the store or the
-- dashboard need. db/admin-1.sql and db/admin-2.sql describe an intended
-- schema, but neither has been applied (and admin-1.sql has two invalid
-- statements: an index created with `if not` instead of `if not exists`,
-- and a foreign key to `categories` before that table is created).
-- This migration is self-contained and works whether or not those older
-- files were ever run.
--
-- SECURITY
-- --------
-- All tables are locked down with RLS: only `service_role` can read or
-- write. The service key is used only by server code in this app. It must
-- never be sent to the browser or prefixed with NEXT_PUBLIC_.
-- ==============================================================

create extension if not exists pgcrypto;

-- --------------------------------------------------------------
-- Taxonomy
-- --------------------------------------------------------------
create table if not exists public.categories (
  slug text primary key,
  name text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.brands (
  slug text primary key,
  name text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.occasions (
  slug text primary key,
  name text not null,
  description text,
  photo_url text,
  featured_slug text,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------
-- Products
-- --------------------------------------------------------------
create table if not exists public.products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text,
  category_slug text not null references public.categories(slug) on delete restrict,
  brand_slug text not null references public.brands(slug) on delete restrict,
  price_cents integer not null default 0 check (price_cents >= 0),
  sale_price_cents integer check (sale_price_cents is null or sale_price_cents >= 0),
  badge text check (badge in ('new', 'bestseller', 'sale')),
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  status text not null default 'active' check (status in ('draft', 'active', 'hidden')),
  sku text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fields the dashboard needs that were missing from the earlier schema.
-- Integer stock is the single source of truth for low-stock alerts.
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists stitching_options text[] not null default '{}';

create table if not exists public.product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  "order" integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_collections (
  product_id bigint not null references public.products(id) on delete cascade,
  occasion_slug text not null references public.occasions(slug) on delete cascade,
  primary key (product_id, occasion_slug)
);

create table if not exists public.stock_sizes (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  size text not null,
  quantity integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, size)
);

-- --------------------------------------------------------------
-- Orders
-- --------------------------------------------------------------
-- The store already saves each order as a JSONB payload. Status lives in
-- that payload, and every status change is appended to its `history`
-- array, so no separate order_items / order_status_history tables are
-- required. db/orders.sql created this table; it is repeated here with
-- `if not exists` so this migration also works on a fresh project.
create table if not exists public.store_orders (
  id text primary key,
  email text not null,
  order_date timestamptz not null,
  idempotency_key text unique,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_store_orders_order_date on public.store_orders (order_date desc);
create index if not exists idx_store_orders_email on public.store_orders (lower(email));

create or replace function public.update_store_order(
  p_order_id text,
  p_expected jsonb,
  p_order jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  saved_order jsonb;
begin
  update public.store_orders
  set email = coalesce(p_order->>'email', ''),
      order_date = (p_order->>'date')::timestamptz,
      idempotency_key = nullif(p_order->>'idempotencyKey', ''),
      payload = p_order,
      updated_at = now()
  where id = p_order_id
    and payload = p_expected
  returning payload into saved_order;

  return saved_order;
end;
$function$;

revoke all on function public.update_store_order(text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.update_store_order(text, jsonb, jsonb)
  to service_role;

-- --------------------------------------------------------------
-- Reviews (customer photos stored as public URLs)
-- --------------------------------------------------------------
create table if not exists public.reviews (
  id text primary key,
  product_slug text not null,
  rating integer not null check (rating between 1 and 5),
  text text not null,
  name text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  order_id text not null default '',
  verified boolean not null default false,
  photo_url text,
  photo_type text
);

create index if not exists idx_reviews_status on public.reviews (status, created_at desc);
create index if not exists idx_reviews_product on public.reviews (product_slug);

-- --------------------------------------------------------------
-- Site settings (store name, contact details, shipping text)
-- --------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------
-- Audit log
-- --------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_email text not null,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_created on public.admin_audit_log (created_at desc);

-- --------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------
create index if not exists idx_products_status on public.products (status);
create index if not exists idx_products_brand on public.products (brand_slug);
create index if not exists idx_products_category on public.products (category_slug);
create index if not exists idx_product_images_product on public.product_images (product_id);
create index if not exists idx_product_collections_occasion on public.product_collections (occasion_slug);
create index if not exists idx_stock_sizes_product on public.stock_sizes (product_id);

-- --------------------------------------------------------------
-- Storage. Uploads use the service key on the server; the bucket is
-- public so product and review photos can be displayed everywhere.
-- --------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-photos',
  'review-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- --------------------------------------------------------------
-- Lock everything down. The service key bypasses RLS; anon and
-- authenticated users get nothing directly through the Data API.
-- --------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'brands', 'occasions', 'products', 'product_images',
    'product_collections', 'stock_sizes', 'store_orders', 'reviews',
    'site_settings', 'admin_audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;
