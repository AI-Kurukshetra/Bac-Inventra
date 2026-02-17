# Bac-Inventra

Inventory Management MVP built with Next.js and Supabase.

## Features
- Products & categories
- Suppliers & customers
- Locations & stock adjustments
- Purchase orders & sales orders
- Low-stock reports and dashboard KPIs

## Setup
1. Create a Supabase project.
2. Run the schema in `sql/schema.sql` using the Supabase SQL editor.
3. If upgrading an existing project, run `sql/tenant_migration.sql`, `sql/billing_migration.sql`, `sql/week3_migration.sql`, and `sql/week4_migration.sql`.
4. For production, use `sql/seed_prod.sql` (do not run `sql/seed.sql`).
5. Create a storage bucket named `org-logos` for organization logos.
6. Copy `.env.local.example` to `.env.local` and fill in keys (including Stripe).
7. Install dependencies and run the app:

```bash
npm install
npm run dev
```

## Notes
- This MVP uses server-side API routes with the Supabase service role key.
- For production, restrict service-role usage and enforce stricter RLS policies.
- Multi-tenant mode requires an Organization. Admins must create one in `/orgs` before using the app.
- `sql/seed.sql` is for development/demo only.
- Billing: create Stripe prices, then update `plans.stripe_price_id` values. Add a Stripe webhook for `/api/billing/webhook`.
- Email notifications: set `RESEND_API_KEY` and `APP_EMAIL_FROM` to enable approval emails.
- Email branding: set `APP_EMAIL_FROM_NAME` and add a logo to the organization profile.
- Low-stock alerts: call `/api/cron/low-stock` with header `x-cron-secret` = `CRON_SECRET`.
- Transfers: requires `inventory_balances` to be initialized per location.
- Barcode labels: open `/labels` to print SKU barcodes.
