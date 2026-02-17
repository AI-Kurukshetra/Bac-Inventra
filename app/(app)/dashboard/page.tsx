"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type Summary = {
  products: number;
  categories: number;
  suppliers: number;
  customers: number;
  lowStock: number;
  totalStockValue: number;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch("/api/reports");
      const data = await res.json();
      setSummary(data.data);
    };
    load();
  }, []);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <section className="panel relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,#93c5fd44,transparent_70%)]" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,#a5b4fc33,transparent_70%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="badge">Overview</div>
            <h1 className="mt-3 text-2xl font-semibold">Inventory Command Center</h1>
            <p className="muted mt-2 text-sm">
              Track stock health, valuation, and partner coverage in real time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-white px-4 py-3">
              <div className="text-xs uppercase tracking-[0.12em] text-muted">Stock value</div>
              <div className="text-xl font-bold text-ink">
                ${summary?.totalStockValue?.toFixed(2) ?? "-"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white px-4 py-3">
              <div className="text-xs uppercase tracking-[0.12em] text-muted">Low stock</div>
              <div className="text-xl font-bold text-ink">{summary?.lowStock ?? "-"}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="muted text-xs uppercase tracking-[0.12em]">Products</div>
          <div className="kpi">{summary?.products ?? "-"}</div>
          <div className="text-xs text-muted">Total active SKUs</div>
        </div>
        <div className="card">
          <div className="muted text-xs uppercase tracking-[0.12em]">Categories</div>
          <div className="kpi">{summary?.categories ?? "-"}</div>
          <div className="text-xs text-muted">Organized collections</div>
        </div>
        <div className="card">
          <div className="muted text-xs uppercase tracking-[0.12em]">Suppliers</div>
          <div className="kpi">{summary?.suppliers ?? "-"}</div>
          <div className="text-xs text-muted">Active partners</div>
        </div>
        <div className="card">
          <div className="muted text-xs uppercase tracking-[0.12em]">Customers</div>
          <div className="kpi">{summary?.customers ?? "-"}</div>
          <div className="text-xs text-muted">Accounts in pipeline</div>
        </div>
        <div className="card">
          <div className="muted text-xs uppercase tracking-[0.12em]">Low Stock Items</div>
          <div className="kpi">{summary?.lowStock ?? "-"}</div>
          <div className="text-xs text-muted">Needs reorder</div>
        </div>
        <div className="card">
          <div className="muted text-xs uppercase tracking-[0.12em]">Stock Value</div>
          <div className="kpi">${summary?.totalStockValue?.toFixed(2) ?? "-"}</div>
          <div className="text-xs text-muted">Total valuation</div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Inventory trend</div>
              <div className="text-xs text-muted">Last 30 days</div>
            </div>
            <span className="status">Stable</span>
          </div>
          <div className="mt-4 h-40 rounded-xl border border-border bg-gradient-to-br from-[#eef2ff] to-white p-4">
            <div className="text-xs text-muted">Chart placeholder</div>
            <div className="mt-6 grid grid-cols-6 items-end gap-2">
              {[36, 48, 40, 52, 58, 45].map((val, idx) => (
                <div
                  key={String(idx)}
                  className="rounded-full bg-accent/70"
                  style={{ height: `${val}px` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="text-sm font-semibold">Next actions</div>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
              <span>Review low stock list</span>
              <span className="status pending">Due today</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
              <span>Approve purchase orders</span>
              <span className="status pending">2 waiting</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
              <span>Verify stock adjustments</span>
              <span className="status">Weekly</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
