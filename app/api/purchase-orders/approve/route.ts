import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";
import { sendEmail } from "@/lib/email";
import { buildApprovalEmail, resolveOrgRecipients } from "@/lib/notifications";

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });

  const body = await req.json();
  const { id, action } = body as { id?: string; action?: "approve" | "reject" };
  if (!id || !action) {
    return NextResponse.json({ error: "Missing id or action" }, { status: 400 });
  }

  const nextStatus = action === "approve" ? "approved" : "rejected";
  const { data, error } = await supabaseAdmin
    .from("purchase_orders")
    .update({
      approval_status: nextStatus,
      approved_by: auth.userId,
      approved_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .select("id, approval_status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from("audit_logs").insert({
    org_id: auth.orgId,
    actor_id: auth.userId,
    entity_type: "purchase_order",
    entity_id: id,
    action: action
  });

  const { data: po } = await supabaseAdmin
    .from("purchase_orders")
    .select("reference")
    .eq("id", id)
    .maybeSingle();

  const { orgName, orgLogoUrl, recipients } = await resolveOrgRecipients(auth.orgId);
  if (recipients.length) {
    await Promise.all(
      recipients.map((to) =>
        sendEmail({
          to,
          subject: `Purchase Order ${po?.reference || ""} ${nextStatus}`,
          html: buildApprovalEmail({
            orgName,
            orgLogoUrl,
            title: "Purchase Order Update",
            reference: po?.reference || id,
            status: nextStatus
          })
        })
      )
    );
  }

  return NextResponse.json({ data });
}
