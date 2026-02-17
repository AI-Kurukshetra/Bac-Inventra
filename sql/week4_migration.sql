-- Week 4 migration: notifications + transfers + barcode

create table if not exists stock_transfers (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  reference text,
  product_id uuid not null references products(id) on delete cascade,
  from_location_id uuid references locations(id) on delete set null,
  to_location_id uuid references locations(id) on delete set null,
  quantity integer not null default 1,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

alter table stock_transfers enable row level security;

create policy "stock_transfers_org_policy" on stock_transfers
  for all using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
