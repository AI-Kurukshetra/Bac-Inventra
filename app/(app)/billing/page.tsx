"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type Plan = {
  id: string;
  name: string;
  description?: string;
  stripe_price_id?: string | null;
  interval?: string | null;
  limits?: Record<string, number | boolean>;
};

type BillingStatus = {
  plan: {
    id: string | null;
    name: string;
    status: string;
    limits: Record<string, number | boolean>;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string | null;
  };
  usage: Record<string, number>;
  subscription: {
    status: string;
    cancel_at_period_end: boolean;
    current_period_end: string | null;
    stripe_subscription_id: string | null;
  } | null;
};

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [plansRes, statusRes] = await Promise.all([
      apiFetch("/api/billing/plans"),
      apiFetch("/api/billing/status")
    ]);
    const plansJson = await plansRes.json();
    const statusJson = await statusRes.json();
    if (plansRes.ok) setPlans(plansJson.data || []);
    if (statusRes.ok) setStatus(statusJson.data || null);
  };

  useEffect(() => {
    load();
  }, []);

  const startCheckout = async (planId: string) => {
    setLoading(true);
    setMessage(null);
    const res = await apiFetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId })
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Checkout failed");
      setLoading(false);
      return;
    }
    window.location.href = json.data.url;
  };

  const openPortal = async () => {
    setLoading(true);
    setMessage(null);
    const res = await apiFetch("/api/billing/portal", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Billing portal unavailable");
      setLoading(false);
      return;
    }
    window.location.href = json.data.url;
  };

  const currentPlanName = status?.plan?.name || "Free";

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Billing</h1>
        <p className="muted">Manage subscription and plan limits.</p>
      </div>

      {message && <div className="panel error">{message}</div>}

      <div className="panel">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm text-muted">Current plan</div>
            <div className="text-lg font-semibold mt-1">{currentPlanName}</div>
            {status?.subscription?.current_period_end && (
              <div className="text-sm text-muted mt-2">
                Renews on {new Date(status.subscription.current_period_end).toLocaleDateString()}
              </div>
            )}
          </div>
          {status?.subscription?.stripe_subscription_id ? (
            <button className="button secondary" onClick={openPortal} disabled={loading}>
              Manage Billing
            </button>
          ) : (
            <button className="button secondary" onClick={() => load()} disabled={loading}>
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-3">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentPlanName;
          const canCheckout = !!plan.stripe_price_id && !isCurrent;
          return (
            <div className="panel" key={plan.id}>
              <div className="text-sm text-muted">{plan.interval || "month"}</div>
              <div className="text-lg font-semibold mt-1">{plan.name}</div>
              <div className="text-sm text-muted mt-2">{plan.description || ""}</div>
              <div className="mt-4 flex items-center gap-2">
                {isCurrent ? (
                  <span className="badge">Current</span>
                ) : (
                  <button
                    className="button"
                    onClick={() => startCheckout(plan.id)}
                    disabled={loading || !canCheckout}
                  >
                    {canCheckout ? "Upgrade" : "Contact Sales"}
                  </button>
                )}
              </div>
              <div className="mt-4 text-sm text-muted">
                {plan.limits?.users !== undefined && `Users: ${plan.limits.users}`}
              </div>
              <div className="text-sm text-muted">
                {plan.limits?.products !== undefined && `Products: ${plan.limits.products}`}
              </div>
              <div className="text-sm text-muted">
                {plan.limits?.locations !== undefined && `Locations: ${plan.limits.locations}`}
              </div>
              <div className="text-sm text-muted">
                {plan.limits?.reports !== undefined && `Reports: ${plan.limits.reports ? "Yes" : "No"}`}
              </div>
            </div>
          );
        })}
      </div>

      {status?.usage && (
        <div className="panel">
          <h3>Usage</h3>
          <div className="grid grid-4" style={{ marginTop: 12 }}>
            {["products", "customers", "suppliers", "users"].map((key) => {
              const current = status.usage[key] || 0;
              const limit = typeof status.plan.limits?.[key] === "number" ? Number(status.plan.limits[key]) : null;
              const ratio = limit ? Math.min(100, Math.round((current / limit) * 100)) : null;
              return (
                <div key={key}>
                  <div className="text-xs text-muted">{key.replace(/_/g, " ")}</div>
                  <div className="text-lg font-semibold">{current}</div>
                  {limit !== null && (
                    <div className="mt-2">
                      <div className="w-full h-2 rounded-full bg-[#ece6db] overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-accent"
                          style={{ width: `${ratio || 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted mt-1">{current}/{limit}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
