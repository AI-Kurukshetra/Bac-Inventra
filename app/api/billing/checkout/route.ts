import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "owner"]);
  if (!auth.ok) return auth.response;
  if (!auth.orgId) return NextResponse.json({ error: "Organization not set" }, { status: 403 });
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const body = await req.json();
  const { planId } = body as { planId?: string };
  if (!planId) return NextResponse.json({ error: "Missing planId" }, { status: 400 });

  const { data: plan, error: planError } = await supabaseAdmin
    .from("plans")
    .select("id, name, stripe_price_id")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: planError?.message || "Plan not found" }, { status: 404 });
  }

  if (!plan.stripe_price_id) {
    return NextResponse.json({ error: "Plan is not connected to Stripe" }, { status: 400 });
  }

  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("id, name, email")
    .eq("id", auth.orgId)
    .single();
  if (orgError || !org) {
    return NextResponse.json({ error: orgError?.message || "Organization not found" }, { status: 404 });
  }

  const { data: existingSub } = await supabaseAdmin
    .from("org_subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("org_id", auth.orgId)
    .maybeSingle();

  if (existingSub?.stripe_subscription_id) {
    return NextResponse.json(
      { error: "Subscription already exists. Use the billing portal to change plan." },
      { status: 400 }
    );
  }

  let stripeCustomerId = existingSub?.stripe_customer_id || null;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      email: org.email || undefined,
      metadata: { org_id: auth.orgId }
    });
    stripeCustomerId = customer.id;
    await supabaseAdmin
      .from("org_subscriptions")
      .upsert({ org_id: auth.orgId, stripe_customer_id: stripeCustomerId, status: "free" });
  }

  const origin = req.headers.get("origin") || "";
  const successUrl = origin ? `${origin}/billing?status=success` : "http://localhost:3000/billing?status=success";
  const cancelUrl = origin ? `${origin}/billing?status=cancel` : "http://localhost:3000/billing?status=cancel";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: auth.orgId,
    metadata: { org_id: auth.orgId, plan_id: plan.id },
    subscription_data: {
      metadata: { org_id: auth.orgId, plan_id: plan.id }
    }
  });

  return NextResponse.json({ data: { url: session.url } });
}
