import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";
import { enforceLimit } from "@/lib/billing";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await supabaseAdmin
      .from("stock_adjustments")
      .select("id, created_at, quantity_delta, reason, products(sku,name), locations(name)")
      .eq("id", id)
      .eq("org_id", auth.orgId)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      data: {
        id: data.id,
        created_at: data.created_at,
        quantity_delta: data.quantity_delta,
        reason: data.reason,
        product_sku: data.products?.sku || "",
        product_name: data.products?.name || "",
        location_name: data.locations?.name || ""
      }
    });
  }

  const { data, error } = await supabaseAdmin
    .from("stock_adjustments")
    .select("id, created_at, quantity_delta, reason, products(name), locations(name)")
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const mapped = (data || []).map((row: any) => ({
    id: row.id,
    created_at: new Date(row.created_at).toLocaleDateString(),
    quantity_delta: row.quantity_delta,
    reason: row.reason,
    product_name: row.products?.name || "",
    location_name: row.locations?.name || ""
  }));
  return NextResponse.json({ data: mapped });
}

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  const limitCheck = await enforceLimit(auth.orgId, "stock_adjustments");
  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 402 });
  }
  const body = await req.json();
  const { product_sku, location_name, quantity_delta, reason } = body;
  if (!product_sku || !String(product_sku).trim() || !location_name || !String(location_name).trim()) {
    return NextResponse.json({ error: "Product and Location are required" }, { status: 400 });
  }
  if (quantity_delta === undefined || quantity_delta === null || String(quantity_delta).trim() === "") {
    return NextResponse.json({ error: "Quantity change is required" }, { status: 400 });
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("sku", product_sku)
    .eq("org_id", auth.orgId)
    .single();
  if (productError) {
    return NextResponse.json({ error: "Product not found" }, { status: 400 });
  }

  const { data: location, error: locationError } = await supabaseAdmin
    .from("locations")
    .select("id")
    .eq("name", location_name)
    .eq("org_id", auth.orgId)
    .maybeSingle();
  if (locationError) {
    return NextResponse.json({ error: locationError.message }, { status: 500 });
  }

  let locationId = location?.id;
  if (!locationId) {
    const { data: newLoc, error: newLocError } = await supabaseAdmin
      .from("locations")
      .insert({ name: location_name, org_id: auth.orgId })
      .select("id")
      .single();
    if (newLocError) {
      return NextResponse.json({ error: newLocError.message }, { status: 500 });
    }
    locationId = newLoc.id;
  }

  const delta = Number(quantity_delta) || 0;

  const { data: current, error: currentError } = await supabaseAdmin
    .from("products")
    .select("quantity")
    .eq("id", product.id)
    .eq("org_id", auth.orgId)
    .single();
  if (currentError) {
    return NextResponse.json({ error: currentError.message }, { status: 500 });
  }

  const nextQty = (Number(current.quantity) || 0) + delta;
  const { error: qtyError } = await supabaseAdmin
    .from("products")
    .update({ quantity: nextQty })
    .eq("id", product.id)
    .eq("org_id", auth.orgId);
  if (qtyError) {
    return NextResponse.json({ error: qtyError.message }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("stock_adjustments")
    .insert({
      product_id: product.id,
      location_id: locationId,
      quantity_delta: delta,
      reason,
      org_id: auth.orgId
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit({
    orgId: auth.orgId,
    actorId: auth.userId,
    entityType: "stock_adjustment",
    entityId: data.id,
    action: "create",
    metadata: { product_sku, location_name, quantity_delta: delta }
  });

  return NextResponse.json({ data });
}

export async function PUT(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  const body = await req.json();
  const { id, product_sku, location_name, quantity_delta, reason } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (!product_sku || !String(product_sku).trim() || !location_name || !String(location_name).trim()) {
    return NextResponse.json({ error: "Product and Location are required" }, { status: 400 });
  }
  if (quantity_delta === undefined || quantity_delta === null || String(quantity_delta).trim() === "") {
    return NextResponse.json({ error: "Quantity change is required" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("stock_adjustments")
    .select("id, quantity_delta, product_id, location_id")
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .single();
  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, quantity")
    .eq("sku", product_sku)
    .eq("org_id", auth.orgId)
    .single();
  if (productError) {
    return NextResponse.json({ error: "Product not found" }, { status: 400 });
  }

  const { data: location, error: locationError } = await supabaseAdmin
    .from("locations")
    .select("id")
    .eq("name", location_name)
    .eq("org_id", auth.orgId)
    .maybeSingle();
  if (locationError) {
    return NextResponse.json({ error: locationError.message }, { status: 500 });
  }

  let locationId = location?.id;
  if (!locationId) {
    const { data: newLoc, error: newLocError } = await supabaseAdmin
      .from("locations")
      .insert({ name: location_name, org_id: auth.orgId })
      .select("id")
      .single();
    if (newLocError) {
      return NextResponse.json({ error: newLocError.message }, { status: 500 });
    }
    locationId = newLoc.id;
  }

  const newDelta = Number(quantity_delta) || 0;
  const oldDelta = Number(existing.quantity_delta) || 0;

  if (existing.product_id === product.id) {
    const deltaDiff = newDelta - oldDelta;
    const { error: qtyError } = await supabaseAdmin
      .from("products")
      .update({ quantity: (Number(product.quantity) || 0) + deltaDiff })
      .eq("id", product.id);
    if (qtyError) {
      return NextResponse.json({ error: qtyError.message }, { status: 500 });
    }
  } else {
    const { data: oldProduct, error: oldProductError } = await supabaseAdmin
      .from("products")
      .select("id, quantity")
      .eq("id", existing.product_id)
      .single();
    if (oldProductError) {
      return NextResponse.json({ error: oldProductError.message }, { status: 500 });
    }
    const { error: oldQtyError } = await supabaseAdmin
      .from("products")
      .update({ quantity: (Number(oldProduct.quantity) || 0) - oldDelta })
      .eq("id", oldProduct.id);
    if (oldQtyError) {
      return NextResponse.json({ error: oldQtyError.message }, { status: 500 });
    }
    const { error: newQtyError } = await supabaseAdmin
      .from("products")
      .update({ quantity: (Number(product.quantity) || 0) + newDelta })
      .eq("id", product.id);
    if (newQtyError) {
      return NextResponse.json({ error: newQtyError.message }, { status: 500 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("stock_adjustments")
    .update({
      product_id: product.id,
      location_id: locationId,
      quantity_delta: newDelta,
      reason
    })
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit({
    orgId: auth.orgId,
    actorId: auth.userId,
    entityType: "stock_adjustment",
    entityId: id,
    action: "update",
    metadata: { product_sku, location_name, quantity_delta: newDelta }
  });

  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("stock_adjustments")
    .select("id, quantity_delta, product_id")
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .single();
  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, quantity")
    .eq("id", existing.product_id)
    .eq("org_id", auth.orgId)
    .single();
  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const nextQty = (Number(product.quantity) || 0) - (Number(existing.quantity_delta) || 0);
  const { error: qtyError } = await supabaseAdmin
    .from("products")
    .update({ quantity: nextQty })
    .eq("id", product.id)
    .eq("org_id", auth.orgId);
  if (qtyError) {
    return NextResponse.json({ error: qtyError.message }, { status: 500 });
  }

  const { error } = await supabaseAdmin
    .from("stock_adjustments")
    .delete()
    .eq("id", id)
    .eq("org_id", auth.orgId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit({
    orgId: auth.orgId,
    actorId: auth.userId,
    entityType: "stock_adjustment",
    entityId: id,
    action: "delete"
  });
  return NextResponse.json({ data: { id } });
}
