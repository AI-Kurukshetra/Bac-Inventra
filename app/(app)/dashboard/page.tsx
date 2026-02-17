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
      <div className="panel">
        <h1>Dashboard</h1>
        <p className="muted">Snapshot of your inventory.</p>
      </div>
      <div className="grid grid-2">
        <div className="card">
          <div className="muted">Products</div>
          <div className="kpi">{summary?.products ?? "-"}</div>
        </div>
        <div className="card">
          <div className="muted">Categories</div>
          <div className="kpi">{summary?.categories ?? "-"}</div>
        </div>
        <div className="card">
          <div className="muted">Suppliers</div>
          <div className="kpi">{summary?.suppliers ?? "-"}</div>
        </div>
        <div className="card">
          <div className="muted">Customers</div>
          <div className="kpi">{summary?.customers ?? "-"}</div>
        </div>
        <div className="card">
          <div className="muted">Low Stock Items</div>
          <div className="kpi">{summary?.lowStock ?? "-"}</div>
        </div>
        <div className="card">
          <div className="muted">Stock Value</div>
          <div className="kpi">${summary?.totalStockValue?.toFixed(2) ?? "-"}</div>
        </div>
      </div>
    </div>
  );
}