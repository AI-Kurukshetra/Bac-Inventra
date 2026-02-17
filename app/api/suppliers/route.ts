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
      .from("suppliers")
      .select("id, name, contact_name, email, phone")
      .eq("id", id)
      .eq("org_id", auth.orgId)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  }

  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .select("id, name, contact_name, email, phone")
    .eq("org_id", auth.orgId)
    .order("name");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  const limitCheck = await enforceLimit(auth.orgId, "suppliers");
  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 402 });
  }
  const body = await req.json();
  const { name, contact_name, email, phone } = body;
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .insert({ name, contact_name, email, phone, org_id: auth.orgId })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit({
    orgId: auth.orgId,
    actorId: auth.userId,
    entityType: "supplier",
    entityId: data.id,
    action: "create",
    metadata: { name }
  });
  return NextResponse.json({ data });
}

export async function PUT(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  const body = await req.json();
  const { id, name, contact_name, email, phone } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .update({ name, contact_name, email, phone })
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
    entityType: "supplier",
    entityId: id,
    action: "update",
    metadata: { name }
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
    .from("suppliers")
    .delete()
    .eq("id", id)
    .eq("org_id", auth.orgId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit({
    orgId: auth.orgId,
    actorId: auth.userId,
    entityType: "supplier",
    entityId: id,
    action: "delete"
  });
  return NextResponse.json({ data: { id } });
}
