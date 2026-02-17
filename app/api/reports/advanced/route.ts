import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";
import { isFeatureEnabled } from "@/lib/billing";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });

  const reportsEnabled = await isFeatureEnabled(auth.orgId, "reports");
  if (!reportsEnabled) {
    return NextResponse.json({ error: "Reports are not available on your plan." }, { status: 402 });
  }

  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select("id, name, sku, unit_price, quantity, created_at, categories(name)")
    .eq("org_id", auth.orgId);
  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  const { data: adjustments, error: adjError } = await supabaseAdmin
    .from("stock_adjustments")
    .select("product_id, quantity_delta, created_at")
    .eq("org_id", auth.orgId);
  if (adjError) {
    return NextResponse.json({ error: adjError.message }, { status: 500 });
  }

  const valuationByCategory: Record<string, number> = {};
  const latestMovement: Record<string, string> = {};
  const movementsLast30: Record<string, number> = {};

  const now = new Date();
  const cutoff30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  (adjustments || []).forEach((row: any) => {
    const ts = new Date(row.created_at);
    const key = row.product_id;
    if (!latestMovement[key] || ts > new Date(latestMovement[key])) {
      latestMovement[key] = row.created_at;
    }
    if (ts >= cutoff30) {
      const day = ts.toISOString().slice(0, 10);
      movementsLast30[day] = (movementsLast30[day] || 0) + Number(row.quantity_delta || 0);
    }
  });

  const productsList = (products || []).map((p: any) => {
    const onHand = Number(p.quantity || 0);
    const price = Number(p.unit_price || 0);
    const category = Array.isArray((p as any).categories)
      ? (p as any).categories?.[0]?.name || "Uncategorized"
      : (p as any).categories?.name || "Uncategorized";
    valuationByCategory[category] = (valuationByCategory[category] || 0) + onHand * price;
    const lastMovement = latestMovement[p.id] || p.created_at;
    const daysSince = Math.floor((now.getTime() - new Date(lastMovement).getTime()) / (24 * 60 * 60 * 1000));
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category,
      on_hand: onHand,
      unit_price: price,
      last_movement_at: lastMovement,
      days_since_movement: daysSince
    };
  });

  const aging = productsList
    .filter((p) => p.days_since_movement >= 30)
    .sort((a, b) => b.days_since_movement - a.days_since_movement)
    .slice(0, 10);

  const movementSeries = Object.entries(movementsLast30)
    .map(([date, quantity]) => ({ date, quantity }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const valuation = Object.entries(valuationByCategory)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);

  return NextResponse.json({
    data: {
      valuation,
      movementLast30: movementSeries,
      aging
    }
  });
}
