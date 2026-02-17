import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "owner"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const perPage = Number(searchParams.get("perPage") || 50);

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = data.users || [];
  const ids = users.map((u) => u.id);

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, full_name, org_id")
    .in("id", ids)
    .eq("org_id", auth.orgId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const mapped = users
    .filter((u) => profileMap.has(u.id))
    .map((u) => {
    const profile = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      banned_until: u.banned_until,
      role: profile?.role || "staff",
      full_name: profile?.full_name || ""
    };
  });

  return NextResponse.json({ data: mapped });
}
