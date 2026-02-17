import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("stock_transfers")
    .select("id, reference, quantity, status, created_at, products(sku,name), from_location:locations!stock_transfers_from_location_id_fkey(name), to_location:locations!stock_transfers_to_location_id_fkey(name)")
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (data || []).map((row: any) => ({
    id: row.id,
    reference: row.reference || "",
    quantity: row.quantity,
    status: row.status,
    created_at: row.created_at,
    product_sku: row.products?.sku || "",
    product_name: row.products?.name || "",
    from_location: row.from_location?.name || "",
    to_location: row.to_location?.name || ""
  }));

  return NextResponse.json({ data: mapped });
}

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });

  const body = await req.json();
  const { reference, product_sku, from_location, to_location, quantity } = body;
  if (!product_sku || !String(product_sku).trim()) {
    return NextResponse.json({ error: "Product SKU is required" }, { status: 400 });
  }
  if (!from_location || !String(from_location).trim() || !to_location || !String(to_location).trim()) {
    return NextResponse.json({ error: "From and To locations are required" }, { status: 400 });
  }
  if (!quantity || Number(quantity) <= 0) {
    return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, sku, name")
    .eq("sku", product_sku)
    .eq("org_id", auth.orgId)
    .single();
  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 400 });
  }

  const { data: fromLoc } = await supabaseAdmin
    .from("locations")
    .select("id")
    .eq("name", from_location)
    .eq("org_id", auth.orgId)
    .maybeSingle();
  const { data: toLoc } = await supabaseAdmin
    .from("locations")
    .select("id")
    .eq("name", to_location)
    .eq("org_id", auth.orgId)
    .maybeSingle();
  if (!fromLoc?.id || !toLoc?.id) {
    return NextResponse.json({ error: "Locations not found" }, { status: 400 });
  }

  // Optional: validate available stock at from_location if using inventory_balances
  const { data: balance, error: balanceError } = await supabaseAdmin
    .from("inventory_balances")
    .select("id, quantity")
    .eq("org_id", auth.orgId)
    .eq("product_id", product.id)
    .eq("location_id", fromLoc.id)
    .maybeSingle();
  if (balanceError) {
    return NextResponse.json({ error: balanceError.message }, { status: 500 });
  }
  const available = Number(balance?.quantity || 0);
  if (available < Number(quantity)) {
    return NextResponse.json({ error: "Insufficient stock at source location" }, { status: 400 });
  }

  // Decrement source, increment destination balances
  await supabaseAdmin
    .from("inventory_balances")
    .upsert({
      org_id: auth.orgId,
      product_id: product.id,
      location_id: fromLoc.id,
      quantity: available - Number(quantity)
    });
  const { data: destBalance } = await supabaseAdmin
    .from("inventory_balances")
    .select("id, quantity")
    .eq("org_id", auth.orgId)
    .eq("product_id", product.id)
    .eq("location_id", toLoc.id)
    .maybeSingle();
  const destQty = Number(destBalance?.quantity || 0) + Number(quantity);
  await supabaseAdmin
    .from("inventory_balances")
    .upsert({
      org_id: auth.orgId,
      product_id: product.id,
      location_id: toLoc.id,
      quantity: destQty
    });

  const { data, error } = await supabaseAdmin
    .from("stock_transfers")
    .insert({
      org_id: auth.orgId,
      reference: reference || null,
      product_id: product.id,
      from_location_id: fromLoc.id,
      to_location_id: toLoc.id,
      quantity: Number(quantity),
      status: "completed"
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    orgId: auth.orgId,
    actorId: auth.userId,
    entityType: "stock_transfer",
    entityId: data.id,
    action: "create",
    metadata: { product_sku, from_location, to_location, quantity: Number(quantity) }
  });

  return NextResponse.json({ data });
}
