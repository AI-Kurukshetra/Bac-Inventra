import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";
import { enforceLimit } from "@/lib/billing";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) {
    return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, sku, name, description, quantity, unit_price, low_stock_threshold, categories(name)")
      .eq("id", id)
      .eq("org_id", auth.orgId)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const categoryName = Array.isArray((data as any).categories)
      ? (data as any).categories?.[0]?.name || ""
      : (data as any).categories?.name || "";
    const mapped = {
      id: data.id,
      sku: data.sku,
      name: data.name,
      description: data.description || "",
      quantity: data.quantity ?? 0,
      unit_price: data.unit_price,
      low_stock_threshold: data.low_stock_threshold,
      category_name: categoryName
    };
    return NextResponse.json({ data: mapped });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, sku, name, description, quantity, unit_price, low_stock_threshold, categories(name)")
    .eq("org_id", auth.orgId)
    .order("name");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const mapped = (data || []).map((row: any) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description || "",
    quantity: row.quantity ?? 0,
    unit_price: row.unit_price,
    low_stock_threshold: row.low_stock_threshold,
    category_name: Array.isArray(row.categories)
      ? row.categories?.[0]?.name || ""
      : row.categories?.name || ""
  }));
  return NextResponse.json({ data: mapped });
}

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) {
    return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  }
  const limitCheck = await enforceLimit(auth.orgId, "products");
  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 402 });
  }
  const body = await req.json();
  const { sku, name, category_name, description, quantity, unit_price, low_stock_threshold } = body;
  if (!sku || !String(sku).trim() || !name || !String(name).trim()) {
    return NextResponse.json({ error: "SKU and Name are required" }, { status: 400 });
  }

  let categoryId: string | null = null;
  if (category_name) {
    const { data: cat, error: catError } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("name", category_name)
      .eq("org_id", auth.orgId)
      .maybeSingle();
    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }
    if (cat) {
      categoryId = cat.id;
    } else {
      const categoryLimit = await enforceLimit(auth.orgId, "categories");
      if (!categoryLimit.ok) {
        return NextResponse.json({ error: categoryLimit.error }, { status: 402 });
      }
      const { data: newCat, error: newCatError } = await supabaseAdmin
        .from("categories")
        .insert({ name: category_name, org_id: auth.orgId })
        .select("id")
        .single();
      if (newCatError) {
        return NextResponse.json({ error: newCatError.message }, { status: 500 });
      }
      categoryId = newCat.id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({
      sku,
      name,
      category_id: categoryId,
      description: description || null,
      quantity: quantity ? Number(quantity) : 0,
      unit_price: unit_price ? Number(unit_price) : 0,
      low_stock_threshold: low_stock_threshold ? Number(low_stock_threshold) : 0,
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
    entityType: "product",
    entityId: data.id,
    action: "create",
    metadata: { sku, name }
  });

  return NextResponse.json({ data });
}

export async function PUT(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) {
    return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  }
  const body = await req.json();
  const { id, sku, name, category_name, description, quantity, unit_price, low_stock_threshold } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (!sku || !String(sku).trim() || !name || !String(name).trim()) {
    return NextResponse.json({ error: "SKU and Name are required" }, { status: 400 });
  }

  let categoryId: string | null = null;
  if (category_name) {
    const { data: cat, error: catError } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("name", category_name)
      .eq("org_id", auth.orgId)
      .maybeSingle();
    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }
    if (cat) {
      categoryId = cat.id;
    } else {
      const categoryLimit = await enforceLimit(auth.orgId, "categories");
      if (!categoryLimit.ok) {
        return NextResponse.json({ error: categoryLimit.error }, { status: 402 });
      }
      const { data: newCat, error: newCatError } = await supabaseAdmin
        .from("categories")
        .insert({ name: category_name, org_id: auth.orgId })
        .select("id")
        .single();
      if (newCatError) {
        return NextResponse.json({ error: newCatError.message }, { status: 500 });
      }
      categoryId = newCat.id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update({
      sku,
      name,
      category_id: categoryId,
      description: description || null,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      unit_price: unit_price !== undefined ? Number(unit_price) : undefined,
      low_stock_threshold: low_stock_threshold !== undefined ? Number(low_stock_threshold) : undefined
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
    entityType: "product",
    entityId: id,
    action: "update",
    metadata: { sku, name }
  });

  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) {
    return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", id)
    .eq("org_id", auth.orgId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit({
    orgId: auth.orgId,
    actorId: auth.userId,
    entityType: "product",
    entityId: id,
    action: "delete"
  });
  return NextResponse.json({ data: { id } });
}
