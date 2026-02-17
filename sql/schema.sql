-- Bac Inventra MVP schema
-- Run this in Supabase SQL editor

create extension if not exists "uuid-ossp";

-- Organizations
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  website text,
  email text,
  phone text,
  logo_url text,
  created_at timestamptz not null default now()
);

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff',
  org_id uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Categories
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  org_id uuid references organizations(id) on delete cascade,
  description text,
  created_at timestamptz not null default now()
);

-- Products
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  sku text not null,
  name text not null,
  category_id uuid references categories(id) on delete set null,
  description text,
  quantity integer not null default 0,
  unit_price numeric(12,2) not null default 0,
  low_stock_threshold integer not null default 0,
  org_id uuid references organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Suppliers
create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  org_id uuid references organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Customers
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  org_id uuid references organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Locations
create table if not exists locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  org_id uuid references organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Inventory balances
create table if not exists inventory_balances (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  quantity integer not null default 0,
  org_id uuid references organizations(id) on delete cascade,
  unique (product_id, location_id, org_id)
);

-- Stock adjustments
create table if not exists stock_adjustments (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  quantity_delta integer not null,
  reason text,
  org_id uuid references organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Purchase orders
create table if not exists purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  reference text,
  supplier_id uuid references suppliers(id) on delete set null,
  status text not null default 'draft',
  approval_status text not null default 'pending',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  total_amount numeric(12,2) not null default 0,
  org_id uuid references organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1,
  unit_cost numeric(12,2) not null default 0,
  org_id uuid references organizations(id) on delete cascade
);

-- Sales orders
create table if not exists sales_orders (
  id uuid primary key default uuid_generate_v4(),
  reference text,
  customer_id uuid references customers(id) on delete set null,
  status text not null default 'draft',
  approval_status text not null default 'pending',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  total_amount numeric(12,2) not null default 0,
  org_id uuid references organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Audit logs
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sales_order_items (
  id uuid primary key default uuid_generate_v4(),
  sales_order_id uuid not null references sales_orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  org_id uuid references organizations(id) on delete cascade
);

-- Tenant-scoped uniques
create unique index if not exists categories_org_name_key on categories (org_id, name);
create unique index if not exists products_org_sku_key on products (org_id, sku);
create unique index if not exists suppliers_org_name_key on suppliers (org_id, name);
create unique index if not exists customers_org_name_key on customers (org_id, name);
create unique index if not exists locations_org_name_key on locations (org_id, name);

-- View for stock calculations
create or replace view product_stock as
select
  p.id as product_id,
  p.sku,
  p.name,
  p.unit_price,
  p.low_stock_threshold,
  p.quantity as on_hand,
  p.org_id
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
alter table audit_logs enable row level security;

-- Policies (tenant scoped)
alter table organizations enable row level security;

create or replace function public.current_org_id()
returns uuid as $$
  select org_id from profiles where id = auth.uid();
$$ language sql stable;

create policy "org_read" on organizations
  for select using (auth.role() = 'authenticated');

create policy "org_write" on organizations
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "profiles_read_write" on profiles
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "categories_org_policy" on categories
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "products_org_policy" on products
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "suppliers_org_policy" on suppliers
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "customers_org_policy" on customers
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "locations_org_policy" on locations
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "inventory_balances_org_policy" on inventory_balances
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "stock_adjustments_org_policy" on stock_adjustments
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "purchase_orders_org_policy" on purchase_orders
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "purchase_order_items_org_policy" on purchase_order_items
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "sales_orders_org_policy" on sales_orders
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "sales_order_items_org_policy" on sales_order_items
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "audit_logs_org_policy" on audit_logs
  for select using (org_id = public.current_org_id());

-- Billing plans
create table if not exists plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  stripe_price_id text unique,
  interval text,
  limits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Org subscription status (single row per org)
create table if not exists org_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid references plans(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'free',
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id)
);

create index if not exists org_subscriptions_org_id_idx on org_subscriptions (org_id);
create index if not exists org_subscriptions_customer_idx on org_subscriptions (stripe_customer_id);
create index if not exists org_subscriptions_subscription_idx on org_subscriptions (stripe_subscription_id);

alter table plans enable row level security;
alter table org_subscriptions enable row level security;

create policy "plans_read" on plans
  for select using (auth.role() = 'authenticated');

create policy "org_subscriptions_read" on org_subscriptions
  for select using (org_id = public.current_org_id());

create policy "org_subscriptions_write" on org_subscriptions
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

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
