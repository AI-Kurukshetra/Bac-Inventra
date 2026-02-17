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
      .from("purchase_orders")
      .select("id, reference, status, approval_status, approved_by, approved_at, total_amount, suppliers(name)")
      .eq("id", id)
      .eq("org_id", auth.orgId)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    let approvedByName = "";
    if (data.approved_by) {
      const { data: approver } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", data.approved_by)
        .maybeSingle();
      approvedByName = approver?.full_name || "";
    }
    return NextResponse.json({
      data: {
        id: data.id,
        reference: data.reference,
        status: data.status,
        approval_status: data.approval_status,
        approved_by: data.approved_by,
        approved_by_name: approvedByName,
        approved_at: data.approved_at,
        total_amount: data.total_amount,
        supplier_name: data.suppliers?.name || ""
      }
    });
  }

  const { data, error } = await supabaseAdmin
    .from("purchase_orders")
    .select("id, reference, status, approval_status, total_amount, suppliers(name)")
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const mapped = (data || []).map((row: any) => ({
    id: row.id,
    reference: row.reference,
    status: row.status,
    approval_status: row.approval_status,
    total_amount: row.total_amount,
    supplier_name: row.suppliers?.name || ""
  }));
  return NextResponse.json({ data: mapped });
}

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  const limitCheck = await enforceLimit(auth.orgId, "purchase_orders");
  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 402 });
  }
  const body = await req.json();
  const { reference, supplier_name, status, total_amount } = body;
  if (!reference || !String(reference).trim() || !supplier_name || !String(supplier_name).trim()) {
    return NextResponse.json({ error: "Reference and Supplier are required" }, { status: 400 });
  }

  let supplierId: string | null = null;
  if (supplier_name) {
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from("suppliers")
      .select("id")
      .eq("name", supplier_name)
      .eq("org_id", auth.orgId)
      .maybeSingle();
    if (supplierError) {
      return NextResponse.json({ error: supplierError.message }, { status: 500 });
    }
    if (supplier) {
      supplierId = supplier.id;
    } else {
      const { data: newSupplier, error: newSupplierError } = await supabaseAdmin
        .from("suppliers")
        .insert({ name: supplier_name, org_id: auth.orgId })
        .select("id")
        .single();
      if (newSupplierError) {
        return NextResponse.json({ error: newSupplierError.message }, { status: 500 });
      }
      supplierId = newSupplier.id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("purchase_orders")
    .insert({
      reference,
      supplier_id: supplierId,
      status: status || "draft",
      total_amount: total_amount ? Number(total_amount) : 0,
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
    entityType: "purchase_order",
    entityId: data.id,
    action: "create",
    metadata: { reference }
  });
  return NextResponse.json({ data });
}

export async function PUT(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  const body = await req.json();
  const { id, reference, supplier_name, status, total_amount } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (!reference || !String(reference).trim() || !supplier_name || !String(supplier_name).trim()) {
    return NextResponse.json({ error: "Reference and Supplier are required" }, { status: 400 });
  }

  let supplierId: string | null = null;
  if (supplier_name) {
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from("suppliers")
      .select("id")
      .eq("name", supplier_name)
      .eq("org_id", auth.orgId)
      .maybeSingle();
    if (supplierError) {
      return NextResponse.json({ error: supplierError.message }, { status: 500 });
    }
    if (supplier) {
      supplierId = supplier.id;
    } else {
      const { data: newSupplier, error: newSupplierError } = await supabaseAdmin
        .from("suppliers")
        .insert({ name: supplier_name, org_id: auth.orgId })
        .select("id")
        .single();
      if (newSupplierError) {
        return NextResponse.json({ error: newSupplierError.message }, { status: 500 });
      }
      supplierId = newSupplier.id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("purchase_orders")
    .update({
      reference,
      supplier_id: supplierId,
      status: status || "draft",
      total_amount: total_amount ? Number(total_amount) : 0
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
    entityType: "purchase_order",
    entityId: id,
    action: "update",
    metadata: { reference }
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
  const { error } = await supabaseAdmin
    .from("purchase_orders")
    .delete()
    .eq("id", id)
    .eq("org_id", auth.orgId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit({
    orgId: auth.orgId,
    actorId: auth.userId,
    entityType: "purchase_order",
    entityId: id,
    action: "delete"
  });
  return NextResponse.json({ data: { id } });
}
