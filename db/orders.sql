-- Durable order storage for production deployments.
-- Run this in the Supabase SQL Editor before setting the Vercel environment
-- variables documented in README.md.

create table if not exists public.store_orders (
  id text primary key,
  email text not null,
  order_date timestamptz not null,
  idempotency_key text unique,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_store_orders_order_date
  on public.store_orders (order_date desc);
create index if not exists idx_store_orders_email
  on public.store_orders (lower(email));

alter table public.store_orders enable row level security;
revoke all on public.store_orders from anon, authenticated;
grant select, insert, update, delete on public.store_orders to service_role;

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
