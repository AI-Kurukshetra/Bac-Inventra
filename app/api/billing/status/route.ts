import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { getOrgPlan, getOrgUsage } from "@/lib/billing";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });

  try {
    const [plan, usage, subscription] = await Promise.all([
      getOrgPlan(auth.orgId),
      getOrgUsage(auth.orgId),
      supabaseAdmin
        .from("org_subscriptions")
        .select("status, cancel_at_period_end, current_period_end, stripe_customer_id, stripe_subscription_id, plan_id")
        .eq("org_id", auth.orgId)
        .maybeSingle()
    ]);

    if (subscription.error) {
      return NextResponse.json({ error: subscription.error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        plan,
        usage,
        subscription: subscription.data || null
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load billing status" }, { status: 500 });
  }
}
