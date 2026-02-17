import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("sku, name, unit_price, low_stock_threshold, quantity, categories(name)")
    .eq("org_id", auth.orgId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (data || []).map((row: any) => ({
    sku: row.sku,
    name: row.name,
    unit_price: row.unit_price,
    low_stock_threshold: row.low_stock_threshold,
    on_hand: row.quantity ?? 0,
    category_name: Array.isArray((row as any).categories)
      ? (row as any).categories?.[0]?.name || ""
      : (row as any).categories?.name || ""
  }));

  return NextResponse.json({ data: mapped });
}
