-- Bac Inventra MVP schema
-- Run this in Supabase SQL editor

create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff',
  created_at timestamptz not null default now()
);

-- Categories
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Products
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  sku text not null unique,
  name text not null,
  category_id uuid references categories(id) on delete set null,
  description text,
  quantity integer not null default 0,
  unit_price numeric(12,2) not null default 0,
  low_stock_threshold integer not null default 0,
  created_at timestamptz not null default now()
);

-- Suppliers
create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  contact_name text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

-- Customers
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

-- Locations
create table if not exists locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Inventory balances
create table if not exists inventory_balances (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  quantity integer not null default 0,
  unique (product_id, location_id)
);

-- Stock adjustments
create table if not exists stock_adjustments (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  quantity_delta integer not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Purchase orders
create table if not exists purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  reference text,
  supplier_id uuid references suppliers(id) on delete set null,
  status text not null default 'draft',
  total_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1,
  unit_cost numeric(12,2) not null default 0
);

-- Sales orders
create table if not exists sales_orders (
  id uuid primary key default uuid_generate_v4(),
  reference text,
  customer_id uuid references customers(id) on delete set null,
  status text not null default 'draft',
  total_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists sales_order_items (
  id uuid primary key default uuid_generate_v4(),
  sales_order_id uuid not null references sales_orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0
);

-- View for stock calculations
create or replace view product_stock as
select
  p.id as product_id,
  p.sku,
  p.name,
  p.unit_price,
  p.low_stock_threshold,
  p.quantity as on_hand
from products p;

-- RLS
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table suppliers enable row level security;
alter table customers enable row level security;
alter table locations enable row level security;
alter table inventory_balances enable row level security;
alter table stock_adjustments enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table sales_orders enable row level security;
alter table sales_order_items enable row level security;

-- Policies (authenticated users only)
create policy "profiles_read_write" on profiles
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "categories_read_write" on categories
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "products_read_write" on products
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "suppliers_read_write" on suppliers
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "customers_read_write" on customers
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "locations_read_write" on locations
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "inventory_balances_read_write" on inventory_balances
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "stock_adjustments_read_write" on stock_adjustments
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "purchase_orders_read_write" on purchase_orders
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "purchase_order_items_read_write" on purchase_order_items
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "sales_orders_read_write" on sales_orders
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "sales_order_items_read_write" on sales_order_items
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
