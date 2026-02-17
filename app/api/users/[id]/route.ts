import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["admin", "owner"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });

  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from("profiles")
    .select("id, org_id")
    .eq("id", params.id)
    .single();
  if (targetError || !targetProfile || targetProfile.org_id !== auth.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { role, blocked } = body as { role?: string; blocked?: boolean };

  if (role) {
    const { error: roleError } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", params.id);
    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }
  }

  if (typeof blocked === "boolean") {
    const banDuration = blocked ? "87600h" : "none"; // 10 years or unban
    const { error: blockError } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
      ban_duration: banDuration
    });
    if (blockError) {
      return NextResponse.json({ error: blockError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ data: { id: params.id } });
}
