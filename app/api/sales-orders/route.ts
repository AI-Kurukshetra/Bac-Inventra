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
      .from("sales_orders")
      .select("id, reference, status, approval_status, approved_by, approved_at, total_amount, customers(name)")
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
    const customerName = Array.isArray((data as any).customers)
      ? (data as any).customers?.[0]?.name || ""
      : (data as any).customers?.name || "";
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
        customer_name: customerName
      }
    });
  }

  const { data, error } = await supabaseAdmin
    .from("sales_orders")
    .select("id, reference, status, approval_status, total_amount, customers(name)")
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
    customer_name: Array.isArray((row as any).customers)
      ? (row as any).customers?.[0]?.name || ""
      : (row as any).customers?.name || ""
  }));
  return NextResponse.json({ data: mapped });
}

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  const limitCheck = await enforceLimit(auth.orgId, "sales_orders");
  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 402 });
  }
  const body = await req.json();
  const { reference, customer_name, status, total_amount } = body;
  if (!reference || !String(reference).trim() || !customer_name || !String(customer_name).trim()) {
    return NextResponse.json({ error: "Reference and Customer are required" }, { status: 400 });
  }

  let customerId: string | null = null;
  if (customer_name) {
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("name", customer_name)
      .eq("org_id", auth.orgId)
      .maybeSingle();
    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }
    if (customer) {
      customerId = customer.id;
    } else {
      const { data: newCustomer, error: newCustomerError } = await supabaseAdmin
        .from("customers")
        .insert({ name: customer_name, org_id: auth.orgId })
        .select("id")
        .single();
      if (newCustomerError) {
        return NextResponse.json({ error: newCustomerError.message }, { status: 500 });
      }
      customerId = newCustomer.id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("sales_orders")
    .insert({
      reference,
      customer_id: customerId,
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
    entityType: "sales_order",
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
  const { id, reference, customer_name, status, total_amount } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (!reference || !String(reference).trim() || !customer_name || !String(customer_name).trim()) {
    return NextResponse.json({ error: "Reference and Customer are required" }, { status: 400 });
  }

  let customerId: string | null = null;
  if (customer_name) {
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("name", customer_name)
      .eq("org_id", auth.orgId)
      .maybeSingle();
    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }
    if (customer) {
      customerId = customer.id;
    } else {
      const { data: newCustomer, error: newCustomerError } = await supabaseAdmin
        .from("customers")
        .insert({ name: customer_name, org_id: auth.orgId })
        .select("id")
        .single();
      if (newCustomerError) {
        return NextResponse.json({ error: newCustomerError.message }, { status: 500 });
      }
      customerId = newCustomer.id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("sales_orders")
    .update({
      reference,
      customer_id: customerId,
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
    entityType: "sales_order",
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
    .from("sales_orders")
    .delete()
    .eq("id", id)
    .eq("org_id", auth.orgId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit({
    orgId: auth.orgId,
    actorId: auth.userId,
    entityType: "sales_order",
    entityId: id,
    action: "delete"
  });
  return NextResponse.json({ data: { id } });
}
