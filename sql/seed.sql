-- Seed data for Bac Inventra MVP
-- Run after schema.sql in Supabase SQL editor

-- Categories
insert into categories (name, description) values
  ('Hardware', 'Computer hardware components'),
  ('Peripherals', 'Keyboards, mice, monitors'),
  ('Networking', 'Routers, switches, cabling'),
  ('Storage', 'Drives and storage media'),
  ('Accessories', 'Cables, adapters, misc')
on conflict (name) do nothing;

-- Suppliers
insert into suppliers (name, contact_name, email, phone) values
  ('TechSource Ltd', 'Ava Patel', 'ava@techsource.com', '+1-415-555-0101'),
  ('Global Components', 'Liam Chen', 'liam@globalcomponents.com', '+1-212-555-0199'),
  ('NetWave Supply', 'Sophia Reyes', 'sophia@netwave.com', '+1-312-555-0177')
on conflict (name) do nothing;

-- Customers
insert into customers (name, email, phone) values
  ('BlueSky Solutions', 'ops@bluesky.com', '+1-646-555-0111'),
  ('Nova IT Services', 'purchasing@novait.com', '+1-408-555-0122'),
  ('Riverbend Media', 'it@riverbendmedia.com', '+1-617-555-0133')
on conflict (name) do nothing;

-- Locations
insert into locations (name, description) values
  ('Main Warehouse', 'Primary storage location'),
  ('Showroom', 'Customer-facing stock'),
  ('Repair Lab', 'RMA and testing area')
on conflict (name) do nothing;

-- Products
insert into products (sku, name, category_id, description, quantity, unit_price, low_stock_threshold)
values
  ('CH-001', 'DDR4 8GB RAM (2666 MHz)', (select id from categories where name='Hardware'), 'Single 8GB DDR4 module', 120, 29.99, 20),
  ('CH-002', 'DDR4 16GB RAM (3200 MHz)', (select id from categories where name='Hardware'), 'Single 16GB DDR4 module', 80, 54.99, 15),
  ('CH-003', '500GB SATA SSD', (select id from categories where name='Storage'), '2.5" SATA SSD', 60, 49.99, 10),
  ('CH-004', '1TB NVMe SSD', (select id from categories where name='Storage'), 'PCIe NVMe M.2 SSD', 40, 89.99, 8),
  ('CH-005', '2TB HDD 7200 RPM', (select id from categories where name='Storage'), '3.5" Desktop HDD', 35, 64.99, 6),
  ('CH-006', '450W Power Supply (80+ Bronze)', (select id from categories where name='Hardware'), 'ATX PSU 450W', 25, 39.99, 5),
  ('CH-007', '650W Power Supply (80+ Gold)', (select id from categories where name='Hardware'), 'ATX PSU 650W', 20, 79.99, 5),
  ('CH-008', 'Mid-Tower PC Case (ATX)', (select id from categories where name='Hardware'), 'ATX compatible case', 18, 69.99, 4),
  ('CH-009', 'CPU Air Cooler', (select id from categories where name='Hardware'), 'Tower air cooler', 30, 34.99, 6),
  ('CH-010', '120mm Case Fan', (select id from categories where name='Accessories'), 'PWM case fan', 90, 9.99, 15),
  ('PR-001', 'Mechanical Keyboard', (select id from categories where name='Peripherals'), 'RGB mechanical keyboard', 22, 59.99, 5),
  ('PR-002', 'Wireless Mouse', (select id from categories where name='Peripherals'), '2.4GHz wireless mouse', 40, 24.99, 8),
  ('PR-003', '27" IPS Monitor', (select id from categories where name='Peripherals'), 'QHD 144Hz display', 12, 229.99, 3),
  ('NW-001', 'Wi-Fi 6 Router', (select id from categories where name='Networking'), 'AX1800 dual-band router', 14, 79.99, 4),
  ('NW-002', '8-Port Gigabit Switch', (select id from categories where name='Networking'), 'Unmanaged switch', 20, 29.99, 5),
  ('AC-001', 'HDMI Cable 2m', (select id from categories where name='Accessories'), 'High-speed HDMI cable', 120, 6.99, 20),
  ('AC-002', 'USB-C to USB-A Adapter', (select id from categories where name='Accessories'), 'USB-C adapter', 70, 7.99, 15)
on conflict (sku) do nothing;

-- Purchase orders
insert into purchase_orders (reference, supplier_id, status, total_amount)
values
  ('PO-1001', (select id from suppliers where name='TechSource Ltd'), 'received', 1250.00),
  ('PO-1002', (select id from suppliers where name='Global Components'), 'open', 860.00)
;

insert into purchase_order_items (purchase_order_id, product_id, quantity, unit_cost)
values
  ((select id from purchase_orders where reference='PO-1001'), (select id from products where sku='CH-001'), 50, 22.50),
  ((select id from purchase_orders where reference='PO-1001'), (select id from products where sku='CH-003'), 30, 38.00),
  ((select id from purchase_orders where reference='PO-1002'), (select id from products where sku='PR-001'), 15, 45.00),
  ((select id from purchase_orders where reference='PO-1002'), (select id from products where sku='NW-001'), 10, 62.00)
;

-- Sales orders
insert into sales_orders (reference, customer_id, status, total_amount)
values
  ('SO-2001', (select id from customers where name='BlueSky Solutions'), 'fulfilled', 540.00),
  ('SO-2002', (select id from customers where name='Nova IT Services'), 'open', 320.00)
;

insert into sales_order_items (sales_order_id, product_id, quantity, unit_price)
values
  ((select id from sales_orders where reference='SO-2001'), (select id from products where sku='PR-002'), 10, 24.00),
  ((select id from sales_orders where reference='SO-2001'), (select id from products where sku='AC-001'), 30, 6.00),
  ((select id from sales_orders where reference='SO-2002'), (select id from products where sku='NW-002'), 6, 29.00),
  ((select id from sales_orders where reference='SO-2002'), (select id from products where sku='CH-010'), 12, 8.00)
;

-- Stock adjustments (history only; quantities are already set on products)
insert into stock_adjustments (product_id, location_id, quantity_delta, reason)
values
  ((select id from products where sku='CH-001'), (select id from locations where name='Main Warehouse'), 120, 'Initial stock'),
  ((select id from products where sku='PR-002'), (select id from locations where name='Showroom'), 40, 'Initial stock'),
  ((select id from products where sku='NW-001'), (select id from locations where name='Main Warehouse'), 14, 'Initial stock')
;
