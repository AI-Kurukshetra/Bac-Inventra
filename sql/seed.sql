-- Seed data for Bac Inventra MVP (multi-tenant safe, idempotent)
-- Run after schema.sql and tenant_migration.sql in Supabase SQL editor

DO $$
DECLARE
  v_org_id uuid;
  v_cat_hardware uuid;
  v_cat_peripherals uuid;
  v_cat_networking uuid;
  v_cat_storage uuid;
  v_cat_accessories uuid;
  v_sup_tech uuid;
  v_sup_global uuid;
  v_sup_netwave uuid;
  v_cust_bluesky uuid;
  v_cust_nova uuid;
  v_loc_main uuid;
  v_loc_show uuid;
  v_loc_repair uuid;
  v_po_1001 uuid;
  v_po_1002 uuid;
  v_so_2001 uuid;
  v_so_2002 uuid;
  v_plan_free uuid;
  v_plan_pro uuid;
  v_plan_business uuid;
BEGIN
  -- Organization
  SELECT id INTO v_org_id
  FROM organizations
  WHERE name = 'Default Org'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name)
    VALUES ('Default Org')
    RETURNING id INTO v_org_id;
  END IF;

  -- Plans
  INSERT INTO plans (name, description, stripe_price_id, interval, limits) VALUES
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
  ON CONFLICT (name) DO UPDATE SET
    description = excluded.description,
    stripe_price_id = excluded.stripe_price_id,
    interval = excluded.interval,
    limits = excluded.limits,
    is_active = true;

  SELECT id INTO v_plan_free FROM plans WHERE name = 'Free' LIMIT 1;
  SELECT id INTO v_plan_pro FROM plans WHERE name = 'Pro' LIMIT 1;
  SELECT id INTO v_plan_business FROM plans WHERE name = 'Business' LIMIT 1;

  -- Default org subscription (free)
  INSERT INTO org_subscriptions (org_id, plan_id, status)
  VALUES (v_org_id, v_plan_free, 'free')
  ON CONFLICT (org_id) DO NOTHING;

  -- Categories
  INSERT INTO categories (name, description, org_id) VALUES
    ('Hardware', 'Computer hardware components', v_org_id),
    ('Peripherals', 'Keyboards, mice, monitors', v_org_id),
    ('Networking', 'Routers, switches, cabling', v_org_id),
    ('Storage', 'Drives and storage media', v_org_id),
    ('Accessories', 'Cables, adapters, misc', v_org_id)
  ON CONFLICT (org_id, name) DO NOTHING;

  SELECT id INTO v_cat_hardware FROM categories WHERE org_id = v_org_id AND name = 'Hardware' LIMIT 1;
  SELECT id INTO v_cat_peripherals FROM categories WHERE org_id = v_org_id AND name = 'Peripherals' LIMIT 1;
  SELECT id INTO v_cat_networking FROM categories WHERE org_id = v_org_id AND name = 'Networking' LIMIT 1;
  SELECT id INTO v_cat_storage FROM categories WHERE org_id = v_org_id AND name = 'Storage' LIMIT 1;
  SELECT id INTO v_cat_accessories FROM categories WHERE org_id = v_org_id AND name = 'Accessories' LIMIT 1;

  -- Suppliers
  INSERT INTO suppliers (name, contact_name, email, phone, org_id) VALUES
    ('TechSource Ltd', 'Ava Patel', 'ava@techsource.com', '+1-415-555-0101', v_org_id),
    ('Global Components', 'Liam Chen', 'liam@globalcomponents.com', '+1-212-555-0199', v_org_id),
    ('NetWave Supply', 'Sophia Reyes', 'sophia@netwave.com', '+1-312-555-0177', v_org_id)
  ON CONFLICT (org_id, name) DO NOTHING;

  SELECT id INTO v_sup_tech FROM suppliers WHERE org_id = v_org_id AND name = 'TechSource Ltd' LIMIT 1;
  SELECT id INTO v_sup_global FROM suppliers WHERE org_id = v_org_id AND name = 'Global Components' LIMIT 1;
  SELECT id INTO v_sup_netwave FROM suppliers WHERE org_id = v_org_id AND name = 'NetWave Supply' LIMIT 1;

  -- Customers
  INSERT INTO customers (name, email, phone, org_id) VALUES
    ('BlueSky Solutions', 'ops@bluesky.com', '+1-646-555-0111', v_org_id),
    ('Nova IT Services', 'purchasing@novait.com', '+1-408-555-0122', v_org_id),
    ('Riverbend Media', 'it@riverbendmedia.com', '+1-617-555-0133', v_org_id)
  ON CONFLICT (org_id, name) DO NOTHING;

  SELECT id INTO v_cust_bluesky FROM customers WHERE org_id = v_org_id AND name = 'BlueSky Solutions' LIMIT 1;
  SELECT id INTO v_cust_nova FROM customers WHERE org_id = v_org_id AND name = 'Nova IT Services' LIMIT 1;

  -- Locations
  INSERT INTO locations (name, description, org_id) VALUES
    ('Main Warehouse', 'Primary storage location', v_org_id),
    ('Showroom', 'Customer-facing stock', v_org_id),
    ('Repair Lab', 'RMA and testing area', v_org_id)
  ON CONFLICT (org_id, name) DO NOTHING;

  SELECT id INTO v_loc_main FROM locations WHERE org_id = v_org_id AND name = 'Main Warehouse' LIMIT 1;
  SELECT id INTO v_loc_show FROM locations WHERE org_id = v_org_id AND name = 'Showroom' LIMIT 1;
  SELECT id INTO v_loc_repair FROM locations WHERE org_id = v_org_id AND name = 'Repair Lab' LIMIT 1;

  -- Products
  INSERT INTO products (sku, name, category_id, description, quantity, unit_price, low_stock_threshold, org_id) VALUES
    ('CH-001', 'DDR4 8GB RAM (2666 MHz)', v_cat_hardware, 'Single 8GB DDR4 module', 120, 29.99, 20, v_org_id),
    ('CH-002', 'DDR4 16GB RAM (3200 MHz)', v_cat_hardware, 'Single 16GB DDR4 module', 80, 54.99, 15, v_org_id),
    ('CH-003', '500GB SATA SSD', v_cat_storage, '2.5" SATA SSD', 60, 49.99, 10, v_org_id),
    ('CH-004', '1TB NVMe SSD', v_cat_storage, 'PCIe NVMe M.2 SSD', 40, 89.99, 8, v_org_id),
    ('CH-005', '2TB HDD 7200 RPM', v_cat_storage, '3.5" Desktop HDD', 35, 64.99, 6, v_org_id),
    ('CH-006', '450W Power Supply (80+ Bronze)', v_cat_hardware, 'ATX PSU 450W', 25, 39.99, 5, v_org_id),
    ('CH-007', '650W Power Supply (80+ Gold)', v_cat_hardware, 'ATX PSU 650W', 20, 79.99, 5, v_org_id),
    ('CH-008', 'Mid-Tower PC Case (ATX)', v_cat_hardware, 'ATX compatible case', 18, 69.99, 4, v_org_id),
    ('CH-009', 'CPU Air Cooler', v_cat_hardware, 'Tower air cooler', 30, 34.99, 6, v_org_id),
    ('CH-010', '120mm Case Fan', v_cat_accessories, 'PWM case fan', 90, 9.99, 15, v_org_id),
    ('PR-001', 'Mechanical Keyboard', v_cat_peripherals, 'RGB mechanical keyboard', 22, 59.99, 5, v_org_id),
    ('PR-002', 'Wireless Mouse', v_cat_peripherals, '2.4GHz wireless mouse', 40, 24.99, 8, v_org_id),
    ('PR-003', '27" IPS Monitor', v_cat_peripherals, 'QHD 144Hz display', 12, 229.99, 3, v_org_id),
    ('NW-001', 'Wi-Fi 6 Router', v_cat_networking, 'AX1800 dual-band router', 14, 79.99, 4, v_org_id),
    ('NW-002', '8-Port Gigabit Switch', v_cat_networking, 'Unmanaged switch', 20, 29.99, 5, v_org_id),
    ('AC-001', 'HDMI Cable 2m', v_cat_accessories, 'High-speed HDMI cable', 120, 6.99, 20, v_org_id),
    ('AC-002', 'USB-C to USB-A Adapter', v_cat_accessories, 'USB-C adapter', 70, 7.99, 15, v_org_id)
  ON CONFLICT (org_id, sku) DO NOTHING;

  -- Purchase orders
  INSERT INTO purchase_orders (reference, supplier_id, status, total_amount, org_id) VALUES
    ('PO-1001', v_sup_tech, 'received', 1250.00, v_org_id),
    ('PO-1002', v_sup_global, 'open', 860.00, v_org_id)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_po_1001 FROM purchase_orders WHERE org_id = v_org_id AND reference = 'PO-1001' LIMIT 1;
  SELECT id INTO v_po_1002 FROM purchase_orders WHERE org_id = v_org_id AND reference = 'PO-1002' LIMIT 1;

  -- Purchase order items
  INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, org_id)
  SELECT v_po_1001, p.id, 50, 22.50, v_org_id FROM products p WHERE p.org_id = v_org_id AND p.sku = 'CH-001'
  ON CONFLICT DO NOTHING;
  INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, org_id)
  SELECT v_po_1001, p.id, 30, 38.00, v_org_id FROM products p WHERE p.org_id = v_org_id AND p.sku = 'CH-003'
  ON CONFLICT DO NOTHING;
  INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, org_id)
  SELECT v_po_1002, p.id, 15, 45.00, v_org_id FROM products p WHERE p.org_id = v_org_id AND p.sku = 'PR-001'
  ON CONFLICT DO NOTHING;
  INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, org_id)
  SELECT v_po_1002, p.id, 10, 62.00, v_org_id FROM products p WHERE p.org_id = v_org_id AND p.sku = 'NW-001'
  ON CONFLICT DO NOTHING;

  -- Sales orders
  INSERT INTO sales_orders (reference, customer_id, status, total_amount, org_id) VALUES
    ('SO-2001', v_cust_bluesky, 'fulfilled', 540.00, v_org_id),
    ('SO-2002', v_cust_nova, 'open', 320.00, v_org_id)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_so_2001 FROM sales_orders WHERE org_id = v_org_id AND reference = 'SO-2001' LIMIT 1;
  SELECT id INTO v_so_2002 FROM sales_orders WHERE org_id = v_org_id AND reference = 'SO-2002' LIMIT 1;

  -- Sales order items
  INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, org_id)
  SELECT v_so_2001, p.id, 10, 24.00, v_org_id FROM products p WHERE p.org_id = v_org_id AND p.sku = 'PR-002'
  ON CONFLICT DO NOTHING;
  INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, org_id)
  SELECT v_so_2001, p.id, 30, 6.00, v_org_id FROM products p WHERE p.org_id = v_org_id AND p.sku = 'AC-001'
  ON CONFLICT DO NOTHING;
  INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, org_id)
  SELECT v_so_2002, p.id, 6, 29.00, v_org_id FROM products p WHERE p.org_id = v_org_id AND p.sku = 'NW-002'
  ON CONFLICT DO NOTHING;
  INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, org_id)
  SELECT v_so_2002, p.id, 12, 8.00, v_org_id FROM products p WHERE p.org_id = v_org_id AND p.sku = 'CH-010'
  ON CONFLICT DO NOTHING;

  -- Stock adjustments (history only; quantities are already set on products)
  INSERT INTO stock_adjustments (product_id, location_id, quantity_delta, reason, org_id)
  SELECT p.id, v_loc_main, 120, 'Initial stock', v_org_id FROM products p WHERE p.org_id = v_org_id AND p.sku = 'CH-001'
  ON CONFLICT DO NOTHING;
  INSERT INTO stock_adjustments (product_id, location_id, quantity_delta, reason, org_id)
  SELECT p.id, v_loc_show, 40, 'Initial stock', v_org_id FROM products p WHERE p.org_id = v_org_id AND p.sku = 'PR-002'
  ON CONFLICT DO NOTHING;
  INSERT INTO stock_adjustments (product_id, location_id, quantity_delta, reason, org_id)
  SELECT p.id, v_loc_main, 14, 'Initial stock', v_org_id FROM products p WHERE p.org_id = v_org_id AND p.sku = 'NW-001'
  ON CONFLICT DO NOTHING;
END $$;
