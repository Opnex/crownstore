create table if not exists products (
  id bigint primary key,
  name text not null,
  category text not null default 'General',
  audience text not null default 'All Shoppers',
  price numeric not null default 0,
  in_stock boolean not null default true,
  stock_count integer not null default 0,
  image_url text default '',
  image_key text default '',
  image_preview_url text default '',
  description text default '',
  featured boolean not null default false,
  badge text default '',
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists store_settings (
  id text primary key default 'main',
  store_name text not null default 'Crown Store',
  logo_text text not null default 'CS',
  whatsapp_number text not null default '',
  contact_email text default '',
  contact_phone text default '',
  contact_address text default '',
  opening_hours text default '',
  delivery_note text default '',
  payment_note text default '',
  hero_title text default '',
  hero_subtitle text default '',
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id bigint primary key,
  customer_name text not null,
  phone text not null,
  address text not null,
  notes text default '',
  total_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  status text not null default 'New',
  items jsonb not null default '[]'::jsonb,
  whatsapp_url text default ''
);

alter table products enable row level security;
alter table store_settings enable row level security;
alter table orders enable row level security;

drop policy if exists "Public can read products" on products;
create policy "Public can read products"
on products for select
to anon
using (true);

drop policy if exists "Anon can manage products" on products;
create policy "Anon can manage products"
on products for all
to anon
using (true)
with check (true);

drop policy if exists "Public can read settings" on store_settings;
create policy "Public can read settings"
on store_settings for select
to anon
using (true);

drop policy if exists "Anon can manage settings" on store_settings;
create policy "Anon can manage settings"
on store_settings for all
to anon
using (true)
with check (true);

drop policy if exists "Anon can manage orders" on orders;
create policy "Anon can manage orders"
on orders for all
to anon
using (true)
with check (true);
