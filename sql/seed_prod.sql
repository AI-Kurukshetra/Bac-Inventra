-- Production seed (minimal)
-- Run only if you need baseline system data. Do NOT insert demo data.

-- Plans (update stripe_price_id with your real Stripe Price IDs)
insert into plans (name, description, stripe_price_id, interval, limits) values
  (
    'Free',
    'Starter plan with basic limits.',
    null,
    'month',
    jsonb_build_object(
      'users', 3,
      'products', 50,
      'categories', 20,
      'suppliers', 20,
      'customers', 50,
      'locations', 2,
      'purchase_orders', 50,
      'sales_orders', 50,
      'stock_adjustments', 200,
      'reports', false
    )
  ),
  (
    'Pro',
    'Best for growing teams.',
    null,
    'month',
    jsonb_build_object(
      'users', 20,
      'products', 1000,
      'categories', 200,
      'suppliers', 200,
      'customers', 1000,
      'locations', 20,
      'purchase_orders', 2000,
      'sales_orders', 2000,
      'stock_adjustments', 10000,
      'reports', true
    )
  ),
  (
    'Business',
    'Advanced plan with higher limits.',
    null,
    'month',
    jsonb_build_object(
      'users', 100,
      'products', 10000,
      'categories', 1000,
      'suppliers', 1000,
      'customers', 10000,
      'locations', 200,
      'purchase_orders', 20000,
      'sales_orders', 20000,
      'stock_adjustments', 100000,
      'reports', true
    )
  )
on conflict (name) do update set
  description = excluded.description,
  stripe_price_id = excluded.stripe_price_id,
  interval = excluded.interval,
  limits = excluded.limits,
  is_active = true;

-- Example: create a system organization if required (optional)
-- insert into organizations (name) values ('Your Company')
-- on conflict do nothing;

-- Example: assign yourself as owner after org creation
-- update profiles set role = 'owner', org_id = '<ORG_ID>' where id = '<USER_ID>';
