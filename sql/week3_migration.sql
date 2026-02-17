-- Week 3 migration: approvals + audit logs

alter table purchase_orders
  add column if not exists approval_status text not null default 'pending',
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz;

alter table sales_orders
  add column if not exists approval_status text not null default 'pending',
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz;

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

alter table audit_logs enable row level security;

create policy "audit_logs_org_policy" on audit_logs
  for select using (org_id = public.current_org_id());
