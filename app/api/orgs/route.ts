import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;

  if (!auth.orgId) {
    return NextResponse.json({ data: null });
  }

  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("id, name, address, website, email, phone, logo_url, created_at")
    .eq("id", auth.orgId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin"]);
  if (!auth.ok) return auth.response;

  if (auth.orgId) {
    return NextResponse.json({ error: "Organization already set" }, { status: 400 });
  }

  const body = await req.json();
  const { name } = body;
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("organizations")
    .insert({ name })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: freePlan } = await supabaseAdmin
    .from("plans")
    .select("id")
    .eq("name", "Free")
    .maybeSingle();

  if (freePlan?.id) {
    await supabaseAdmin
      .from("org_subscriptions")
      .upsert({ org_id: data.id, plan_id: freePlan.id, status: "free" });
  }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ org_id: data.id, role: "owner" })
    .eq("id", auth.userId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PUT(req: Request) {
  const auth = await requireRole(req, ["admin", "owner"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });

  const body = await req.json();
  const { name, address, website, email, phone, logo_url } = body;

  const { data, error } = await supabaseAdmin
    .from("organizations")
    .update({ name, address, website, email, phone, logo_url })
    .eq("id", auth.orgId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
