import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");
  if (!entityType || !entityId) {
    return NextResponse.json({ error: "Missing entity_type or entity_id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("id, actor_id, action, created_at, metadata")
    .eq("org_id", auth.orgId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const actorIds = Array.from(new Set((data || []).map((row: any) => row.actor_id).filter(Boolean)));
  let actorMap: Record<string, string> = {};
  if (actorIds.length) {
    const { data: actors } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    actorMap = (actors || []).reduce<Record<string, string>>((acc: Record<string, string>, row: any) => {
      acc[row.id] = row.full_name || "";
      return acc;
    }, {});
  }

  const mapped = (data || []).map((row: any) => ({
    id: row.id,
    actor_id: row.actor_id,
    actor_name: row.actor_id ? actorMap[row.actor_id] || "" : "",
    action: row.action,
    created_at: row.created_at,
    metadata: row.metadata || {}
  }));

  return NextResponse.json({ data: mapped });
}
