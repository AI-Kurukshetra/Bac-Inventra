import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email";
import { resolveOrgRecipients } from "@/lib/notifications";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret") || "";
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, org_id, sku, name, quantity, low_stock_threshold");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byOrg: Record<string, any[]> = {};
  (products || [])
    .filter((p: any) => Number(p.quantity || 0) <= Number(p.low_stock_threshold || 0))
    .forEach((p: any) => {
      if (!p.org_id) return;
      if (!byOrg[p.org_id]) byOrg[p.org_id] = [];
      byOrg[p.org_id].push(p);
    });

  for (const [orgId, items] of Object.entries(byOrg)) {
    const { orgName, orgLogoUrl, recipients } = await resolveOrgRecipients(orgId);
    if (!recipients.length) continue;
    const rows = items
      .map(
        (i) =>
          `<tr><td>${i.sku}</td><td>${i.name}</td><td>${i.quantity}</td><td>${i.low_stock_threshold}</td></tr>`
      )
      .join("");
    const html = `
      <div style="font-family: Arial, sans-serif; background:#f6f3ee; padding:24px;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e7e1d8; border-radius:12px; padding:20px;">
          ${orgLogoUrl ? `<img src="${orgLogoUrl}" alt="${orgName}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; border:1px solid #e7e1d8;" />` : ""}
          <h2 style="margin:12px 0 4px 0;">Low Stock Alert</h2>
          <p style="color:#6b6b6b;">${orgName}</p>
          <table style="width:100%; border-collapse:collapse; margin-top:12px;">
            <thead>
              <tr>
                <th style="text-align:left; border-bottom:1px solid #e7e1d8; padding:6px;">SKU</th>
                <th style="text-align:left; border-bottom:1px solid #e7e1d8; padding:6px;">Product</th>
                <th style="text-align:left; border-bottom:1px solid #e7e1d8; padding:6px;">On Hand</th>
                <th style="text-align:left; border-bottom:1px solid #e7e1d8; padding:6px;">Threshold</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;

    await Promise.all(
      recipients.map((to) =>
        sendEmail({
          to,
          subject: "Low Stock Alert",
          html
        })
      )
    );
  }

  return NextResponse.json({ data: { sent: Object.keys(byOrg).length } });
}
