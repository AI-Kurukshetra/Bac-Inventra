import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PlanLimits = Record<string, number | boolean>;

export type OrgPlan = {
  id: string | null;
  name: string;
  limits: PlanLimits;
  status: string;
  stripePriceId?: string | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
};

const DEFAULT_PLAN: OrgPlan = {
  id: null,
  name: "Free",
  status: "free",
  limits: {
    users: 3,
    products: 50,
    categories: 20,
    suppliers: 20,
    customers: 50,
    locations: 2,
    purchase_orders: 50,
    sales_orders: 50,
    stock_adjustments: 200,
    reports: false
  }
};

export async function getOrgPlan(orgId: string): Promise<OrgPlan> {
  const { data, error } = await supabaseAdmin
    .from("org_subscriptions")
    .select("status, cancel_at_period_end, current_period_end, plans(id, name, limits, stripe_price_id)")
    .eq("org_id", orgId)
    .maybeSingle();

  if (error || !data || !data.plans) {
    return DEFAULT_PLAN;
  }

  return {
    id: data.plans.id,
    name: data.plans.name || DEFAULT_PLAN.name,
    limits: (data.plans.limits as PlanLimits) || DEFAULT_PLAN.limits,
    status: data.status || DEFAULT_PLAN.status,
    stripePriceId: data.plans.stripe_price_id,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
    currentPeriodEnd: data.current_period_end ?? null
  };
}

export async function getOrgUsage(orgId: string) {
  const keys = [
    "products",
    "categories",
    "suppliers",
    "customers",
    "locations",
    "purchase_orders",
    "sales_orders",
    "stock_adjustments",
    "users"
  ];
  const counts = await Promise.all(keys.map((key) => getUsageCount(orgId, key)));
  return keys.reduce<Record<string, number>>((acc, key, idx) => {
    acc[key] = counts[idx];
    return acc;
  }, {});
}

export async function getUsageCount(orgId: string, key: string) {
  const tableMap: Record<string, string> = {
    products: "products",
    categories: "categories",
    suppliers: "suppliers",
    customers: "customers",
    locations: "locations",
    purchase_orders: "purchase_orders",
    sales_orders: "sales_orders",
    stock_adjustments: "stock_adjustments",
    users: "profiles"
  };
  const table = tableMap[key];
  if (!table) return 0;
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  if (error) {
    throw new Error(error.message);
  }
  return count || 0;
}

export async function enforceLimit(orgId: string, key: string) {
  const plan = await getOrgPlan(orgId);
  const limit = plan.limits?.[key];
  if (typeof limit !== "number") {
    return { ok: true, plan };
  }
  const current = await getUsageCount(orgId, key);
  if (current >= limit) {
    return {
      ok: false,
      plan,
      limit,
      current,
      error: `Plan limit reached (${plan.name}: ${limit} ${key.replace(/_/g, " ")}).`
    };
  }

  return { ok: true, plan, limit, current };
}

export async function isFeatureEnabled(orgId: string, key: string) {
  const plan = await getOrgPlan(orgId);
  const value = plan.limits?.[key];
  if (typeof value === "boolean") return value;
  return true;
}
