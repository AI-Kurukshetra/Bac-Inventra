import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";
import { enforceLimit } from "@/lib/billing";

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "owner"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  const limitCheck = await enforceLimit(auth.orgId, "users");
  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 402 });
  }

  const body = await req.json();
  const { email, role } = body as { email: string; role: string };
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || "";
  const redirectTo = origin ? `${origin}/login` : undefined;
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || "Invite failed" }, { status: 500 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ org_id: auth.orgId, role: role || "staff" })
    .eq("id", data.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id: data.user.id, email: data.user.email } });
}
