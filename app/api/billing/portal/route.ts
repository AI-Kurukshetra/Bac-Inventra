import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "owner"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const { data: sub, error } = await supabaseAdmin
    .from("org_subscriptions")
    .select("stripe_customer_id")
    .eq("org_id", auth.orgId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || "";
  const returnUrl = origin ? `${origin}/billing` : "http://localhost:3000/billing";

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: returnUrl
  });

  return NextResponse.json({ data: { url: session.url } });
}
