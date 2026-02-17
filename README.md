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
3. Create a storage bucket named `product-images` (optional, for later).
4. Copy `.env.local.example` to `.env.local` and fill in keys.
5. Install dependencies and run the app:

```bash
npm install
npm run dev
```

## Notes
- This MVP uses server-side API routes with the Supabase service role key.
- For production, restrict service-role usage and enforce stricter RLS policies.
