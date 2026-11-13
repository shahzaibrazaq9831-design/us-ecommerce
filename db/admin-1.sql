-- Database schema for admin foundation (db/admin-1.sql)
-- Run with: npx supabase migration new init && npx supabase migration up
--
-- These tables support the admin area: products, categories, brands,
-- collections (occasions), product_collections, stock, and audit logging.

-- Enable uuid extension for product_images
create extension if not exists "uuid-oss";

-- ------------------------------------------------------------------
-- Table: products
-- ------------------------------------------------------------------
create table if not exists products (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  description text,
  category_slug text not null references categories(slug) on delete restrict,
  brand_slug text not null references brands(slug) on delete restrict,
  price_cents integer not null default 0,
  sale_price_cents integer default null,
  badge text check (badge in ('new','bestseller','sale')),
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  status text not null default 'active' check (status in ('draft','active','hidden')),
  sku text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Table: product_images
-- ------------------------------------------------------------------
create table if not exists product_images (
  id bigserial primary key,
  product_id bigint not null references products(id) on delete cascade,
  url text not null,
  alt_text text,
  "order" integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Table: categories
-- ------------------------------------------------------------------
create table if not exists categories (
  slug text primary key,
  name text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Table: brands
-- ------------------------------------------------------------------
create table if not exists brands (
  slug text primary key,
  name text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Table: occasions (collections)
-- ------------------------------------------------------------------
create table if not exists occasions (
  slug text primary key,
  name text not null,
  description text,
  photo_url text,
  featured_slug text references products(slug) on delete set null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Table: product_collections (many-to-many: products <-> occasions)
-- ------------------------------------------------------------------
create table if not exists product_collections (
  product_id bigint not null references products(id) on delete cascade,
  occasion_slug text not null references occasions(slug) on delete cascade,
  primary key (product_id, occasion_slug)
);

-- ------------------------------------------------------------------
-- Table: stock_sizes
-- ------------------------------------------------------------------
create table if not exists stock_sizes (
  id bigserial primary key,
  product_id bigint not null references products(id) on delete cascade,
  size text not null,
  quantity integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, size)
);

-- ------------------------------------------------------------------
-- Table: admin_audit_log
-- ------------------------------------------------------------------
create table if not exists admin_audit_log (
  id bigserial primary key,
  admin_email text not null,
  action text not null,
  entity text not null,
  entity_id bigint,
  details jsonb default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_products_slug on products(slug);
create index if not idx_products_status on products(status);
create index if not idx_products_brand on products(brand_slug);
create index if not idx_products_category on products(category_slug);
create index if not idx_products_active on products(status) where status = 'active';
create index if not idx_product_images_product on product_images(product_id);
create index if not idx_product_images_cover on product_images(product_id) where is_cover = true;
create index if not idx_occasions_slug on occasions(slug);
create index if not idx_stock_product on stock_sizes(product_id);
create index if not idx_audit_entity on admin_audit_log(entity, entity_id);
create index if not idx_audit_created on admin_audit_log(created_at desc);

-- Row-level security policies (enable for production)
-- alter table products enable row level security;
-- alter table admin_audit_log enable row level security;
-- create policy "Admins can read products" on products using (true);
-- create policy "Admins can modify products" on products using (true) with check (true);
-- create policy "Admins can read audit log" on admin_audit_log using (true);
-- create policy "Admins can insert audit log" on admin_audit_log with check (true);