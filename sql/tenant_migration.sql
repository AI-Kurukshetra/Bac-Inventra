-- Multi-tenant migration (run after schema.sql)

-- Organizations
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Add org_id to profiles
alter table profiles add column if not exists org_id uuid references organizations(id) on delete set null;

-- Add org_id to core tables
alter table categories add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table products add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table suppliers add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table customers add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table locations add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table inventory_balances add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table stock_adjustments add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table purchase_orders add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table purchase_order_items add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table sales_orders add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table sales_order_items add column if not exists org_id uuid references organizations(id) on delete cascade;

-- Optional: create a default org and attach existing data
insert into organizations (name)
select 'Default Org'
where not exists (select 1 from organizations);

-- Attach existing profiles to default org
update profiles set org_id = (select id from organizations limit 1)
where org_id is null;

-- Attach existing data to default org
update categories set org_id = (select id from organizations limit 1) where org_id is null;
update products set org_id = (select id from organizations limit 1) where org_id is null;
update suppliers set org_id = (select id from organizations limit 1) where org_id is null;
update customers set org_id = (select id from organizations limit 1) where org_id is null;
update locations set org_id = (select id from organizations limit 1) where org_id is null;
update inventory_balances set org_id = (select id from organizations limit 1) where org_id is null;
update stock_adjustments set org_id = (select id from organizations limit 1) where org_id is null;
update purchase_orders set org_id = (select id from organizations limit 1) where org_id is null;
update purchase_order_items set org_id = (select id from organizations limit 1) where org_id is null;
update sales_orders set org_id = (select id from organizations limit 1) where org_id is null;
update sales_order_items set org_id = (select id from organizations limit 1) where org_id is null;

-- Drop global unique constraints and replace with tenant-scoped uniques
alter table categories drop constraint if exists categories_name_key;
create unique index if not exists categories_org_name_key on categories (org_id, name);

alter table products drop constraint if exists products_sku_key;
create unique index if not exists products_org_sku_key on products (org_id, sku);

alter table suppliers drop constraint if exists suppliers_name_key;
create unique index if not exists suppliers_org_name_key on suppliers (org_id, name);

alter table customers drop constraint if exists customers_name_key;
create unique index if not exists customers_org_name_key on customers (org_id, name);

alter table locations drop constraint if exists locations_name_key;
create unique index if not exists locations_org_name_key on locations (org_id, name);

-- RLS: organizations (admins only to read)
alter table organizations enable row level security;

create policy "org_read" on organizations
  for select using (auth.role() = 'authenticated');

create policy "org_write" on organizations
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Helper to get current user's org_id
create or replace function public.current_org_id()
returns uuid as $$
  select org_id from profiles where id = auth.uid();
$$ language sql stable;

-- Update policies to be org-scoped
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

-- Update view to include org_id
drop view if exists product_stock;

create or replace view product_stock as
select
  p.id as product_id,
  p.sku,
  p.name,
  p.unit_price,
  p.low_stock_threshold,
  p.quantity::bigint as on_hand,
  p.org_id
from products p;
