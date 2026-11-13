-- Database schema for admin-2-storefront (db/admin-2.sql)
-- Run with: npx supabase migration new admin_2 && npx supabase migration up
--
-- Tables for storefront admin: sections, section_items, sales, discount_codes,
-- hero_slides, and site_settings.

-- ------------------------------------------------------------------
-- Table: sections (homepage sections like New Arrivals, Luxury Formals, etc.)
-- ------------------------------------------------------------------
create table if not exists sections (
  id bigserial primary key,
  key text not null unique,           -- e.g. "new-arrivals", "luxury-formals", "best-selling"
  name text not null,
  description text,
  type text not null check (type in ('manual', 'rule')), -- manual: pick products; rule: filter by criteria
  is_visible boolean not null default true,
  order_idx integer not null default 0, -- order on homepage
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Table: section_items (products per section, or rule state)
-- ------------------------------------------------------------------
create table if not exists section_items (
  id bigserial primary key,
  section_id bigint not null references sections(id) on delete cascade,
  product_slug text references products(slug) on delete set null,
  rule_type text,                      -- e.g. "newest_n", "best_selling_n", "category", "collection", "on_sale"
  rule_value jsonb default '{}'::jsonb, -- e.g. { category: "bridal", limit: 10 } or { occasion: "barat", limit: 5 }
  order_idx integer not null default 0, -- order within section
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_id, product_slug)
);

-- ------------------------------------------------------------------
-- Table: sales (store-wide and per-segment sales)
-- ------------------------------------------------------------------
create table if not exists sales (
  id bigserial primary key,
  key text not null unique,             -- e.g. "seasonal-20", "winter-sale"
  name text not null,
  description text,
  percent_off integer not null check (percent_off > 0 and percent_off <= 100),
  type text not null check (type in ('store', 'category', 'collection', 'product')),
  target_id text,                       -- category slug, collection slug, or product slug
  target_type text,                     -- references categories(slug), occasions(slug), or products(slug)
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean not null default true,
  usage_limit integer,                  -- null = unlimited; else max uses per customer or globally
  times_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Table: discount_codes (public promo codes like PPD10)
-- ------------------------------------------------------------------
create table if not exists discount_codes (
  code text primary key,                -- e.g. "PPD10", "WELCOME20"
  percent_off integer not null check (percent_off > 0 and percent_off <= 100),
  type text not null check (type in ('percentage', 'fixed')),
  value numeric,                        -- fixed amount when type='fixed'
  minimum_order numeric,                -- minimum order total to apply
  start_date timestamptz,
  end_date timestamptz,
  usage_limit integer,                  -- null = unlimited per customer; or total uses
  times_used integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Table: hero_slides (for /admin/content hero slides management)
-- ------------------------------------------------------------------
create table if not exists hero_slides (
  id bigserial primary key,
  eyebrow text,
  title text not null,
  subtitle text,
  cta text,
  href text,
  /** Landscape artwork used from 1024px up. */
  image_url text,
  /** Portrait artwork (427 x 534) used by the phone hero. */
  mobile_image_url text,
  is_active boolean not null default true,
  order_idx integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Table: site_settings (store-wide configuration read by offer strip, etc.)
-- ------------------------------------------------------------------
create table if not exists site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Insert default site_settings rows
insert into site_settings (key, value) values
  ('offer_strip_end_date', null::text),     -- ISO date string or null
  ('announcement_bar_text', null::text),    -- null = show default; otherwise custom text
  ('contact_phone', '+447476469395'),       -- default from site config
  ('contact_email', 'rungebahar@gmail.com');-- default from site config

-- Indexes
create index if not exists idx_sections_key on sections(key);
create index if not exists idx_sections_visible on sections(is_visible, order_idx);
create index if not exists idx_section_items_section on section_items(section_id);
create index if not exists idx_sales_key on sales(key);
create index if not exists idx_sales_active on sales(is_active, start_date, end_date);
create index if not exists idx_discount_codes_code on discount_codes(code);
create index if not exists idx_discount_codes_active on discount_codes(is_active, start_date, end_date);
create index if not exists idx_hero_slides_active on hero_slides(is_active, order_idx);

-- Row-level security policies (enable for production)
-- alter table sections enable row level security;
-- alter table section_items enable row level security;
-- alter table sales enable row level security;
-- alter table discount_codes enable row level security;
-- alter table hero_slides enable row level security;
-- alter table site_settings enable row level security;
-- create policy "Admins can read sections" on sections using (true);
-- create policy "Admins can modify sections" on sections using (true) with check (true);
-- create policy "Admins can read section_items" on section_items using (true);
-- create policy "Admins can read sales" on sales using (true);
-- create policy "Admins can modify sales" on sales using (true) with check (true);
-- create policy "Admins can read discount_codes" on discount_codes using (true);
-- create policy "Admins can modify discount_codes" on discount_codes using (true) with check (true);
-- create policy "Admins can read hero_slides" on hero_slides using (true);
-- create policy "Admins can modify hero_slides" on hero_slides using (true) with check (true);
-- create policy "Admins can read site_settings" on site_settings using (true);
-- create policy "Admins can modify site_settings" on site_settings using (true) with check (true);