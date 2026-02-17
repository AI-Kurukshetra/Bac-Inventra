-- Billing migration (run after tenant_migration.sql)

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
