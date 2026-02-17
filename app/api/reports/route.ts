import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;
  const [products, categories, suppliers, customers, stock] = await Promise.all([
    supabaseAdmin.from("products").select("id", { count: "exact" }),
    supabaseAdmin.from("categories").select("id", { count: "exact" }),
    supabaseAdmin.from("suppliers").select("id", { count: "exact" }),
    supabaseAdmin.from("customers").select("id", { count: "exact" }),
    supabaseAdmin.from("product_stock").select("sku, name, on_hand, unit_price, low_stock_threshold")
  ]);

  if (products.error || categories.error || suppliers.error || customers.error || stock.error) {
    const error = products.error || categories.error || suppliers.error || customers.error || stock.error;
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  const rows = (stock.data || []).map((row: any) => ({
    ...row,
    on_hand: Number(row.on_hand) || 0,
    unit_price: Number(row.unit_price) || 0,
    low_stock_threshold: Number(row.low_stock_threshold) || 0
  }));
  const lowStockItems = rows.filter((row: any) => row.on_hand <= row.low_stock_threshold);
  const totalStockValue = rows.reduce(
    (sum: number, row: any) => sum + row.on_hand * row.unit_price,
    0
  );

  const productsCount = products.count ?? products.data?.length ?? 0;
  const categoriesCount = categories.count ?? categories.data?.length ?? 0;
  const suppliersCount = suppliers.count ?? suppliers.data?.length ?? 0;
  const customersCount = customers.count ?? customers.data?.length ?? 0;

  return NextResponse.json({
    data: {
      products: productsCount,
      categories: categoriesCount,
      suppliers: suppliersCount,
      customers: customersCount,
      lowStock: lowStockItems.length,
      totalStockValue,
      lowStockItems
    }
  });
}
