import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function resolveOrgRecipients(orgId: string) {
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("name, email, logo_url")
    .eq("id", orgId)
    .maybeSingle();

  const { data: admins } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("org_id", orgId)
    .in("role", ["owner", "admin"]);

  const ids = Array.from(new Set((admins || []).map((row: any) => row.id)));
  let emails: string[] = [];
  if (ids.length) {
    const lookups = await Promise.all(
      ids.map((id) => supabaseAdmin.auth.admin.getUserById(id))
    );
    emails = lookups
      .map((res) => res.data.user?.email || "")
      .filter((email) => !!email);
  }

  if (org?.email) {
    emails.push(org.email);
  }

  const uniqueEmails = Array.from(new Set(emails));
  return {
    orgName: org?.name || "Organization",
    orgLogoUrl: org?.logo_url || "",
    recipients: uniqueEmails
  };
}

export function buildApprovalEmail(params: {
  orgName: string;
  orgLogoUrl?: string;
  title: string;
  reference: string;
  status: string;
}) {
  const { orgName, orgLogoUrl, title, reference, status } = params;
  const badgeColor = status === "approved" ? "#16a34a" : "#dc2626";
  const badgeBg = status === "approved" ? "#dcfce7" : "#fee2e2";

  return `
  <div style="font-family: Arial, sans-serif; background:#f6f3ee; padding:24px;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e7e1d8; border-radius:12px; padding:20px;">
      <div style="display:flex; align-items:center; gap:12px;">
        ${orgLogoUrl ? `<img src="${orgLogoUrl}" alt="${orgName}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; border:1px solid #e7e1d8;" />` : ""}
        <div>
          <div style="font-size:14px; color:#6b6b6b;">${orgName}</div>
          <div style="font-size:18px; font-weight:700; color:#0f172a;">${title}</div>
        </div>
      </div>
      <div style="margin-top:16px; font-size:14px; color:#0f172a;">
        <div><strong>Reference:</strong> ${reference}</div>
        <div style="margin-top:10px; display:inline-block; padding:6px 10px; border-radius:999px; font-weight:600; background:${badgeBg}; color:${badgeColor};">
          ${status.toUpperCase()}
        </div>
      </div>
      <div style="margin-top:18px; font-size:12px; color:#6b6b6b;">
        This is an automated notification from BAC-Inventra.
      </div>
    </div>
  </div>
  `;
}
