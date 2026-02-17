import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entity_type");
  const action = searchParams.get("action");
  const actorId = searchParams.get("actor_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
  const offset = Number(searchParams.get("offset") || 0);

  let query = supabaseAdmin
    .from("audit_logs")
    .select("id, actor_id, entity_type, entity_id, action, created_at, metadata", { count: "exact" })
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (entityType) query = query.eq("entity_type", entityType);
  if (action) query = query.eq("action", action);
  if (actorId) query = query.eq("actor_id", actorId);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error, count } = await query;
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
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    action: row.action,
    created_at: row.created_at,
    metadata: row.metadata || {}
  }));

  return NextResponse.json({ data: mapped, count: count || 0 });
}
