import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function resolvePlanId(priceId: string | null) {
  if (!priceId) return null;
  const { data } = await supabaseAdmin.from("plans").select("id").eq("stripe_price_id", priceId).maybeSingle();
  return data?.id || null;
}

async function resolveFreePlanId() {
  const { data } = await supabaseAdmin.from("plans").select("id").eq("name", "Free").maybeSingle();
  return data?.id || null;
}

async function upsertSubscription(args: {
  orgId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  planId: string | null;
}) {
  const { orgId, stripeCustomerId, stripeSubscriptionId, status, cancelAtPeriodEnd, currentPeriodEnd, planId } = args;
  await supabaseAdmin.from("org_subscriptions").upsert({
    org_id: orgId,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    status,
    cancel_at_period_end: cancelAtPeriodEnd,
    current_period_end: currentPeriodEnd,
    plan_id: planId
  });
}

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret missing" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const orgId = session.metadata?.org_id || session.client_reference_id;
      if (!orgId || !session.subscription) break;
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items?.data?.[0]?.price?.id || null;
      const planId = await resolvePlanId(priceId);
      await upsertSubscription({
        orgId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        planId
      });
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as any;
      const orgId = subscription.metadata?.org_id;
      if (!orgId) break;
      const priceId = subscription.items?.data?.[0]?.price?.id || null;
      let planId = await resolvePlanId(priceId);
      if (event.type === "customer.subscription.deleted") {
        planId = await resolveFreePlanId();
      }
      await upsertSubscription({
        orgId,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        planId
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
