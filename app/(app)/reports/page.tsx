"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type ReportData = {
  lowStockItems: { sku: string; name: string; on_hand: number; low_stock_threshold: number }[];
};

type AdvancedReport = {
  valuation: { category: string; value: number }[];
  movementLast30: { date: string; quantity: number }[];
  aging: { sku: string; name: string; category: string; on_hand: number; days_since_movement: number }[];
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState<AdvancedReport | null>(null);

  useEffect(() => {
    const load = async () => {
      const [res, advRes] = await Promise.all([
        apiFetch("/api/reports"),
        apiFetch("/api/reports/advanced")
      ]);
      const json = await res.json();
      const advJson = await advRes.json();
      if (!res.ok) {
        setError(json.error || "Unable to load reports");
        return;
      }
      if (!advRes.ok) {
        setError(advJson.error || "Unable to load advanced reports");
        return;
      }
      setData(json.data);
      setAdvanced(advJson.data);
    };
    load();
  }, []);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Reports</h1>
        <p className="muted">Low-stock alerts and valuation insights.</p>
      </div>
      <div className="panel">
        <h3>Low Stock Items</h3>
        {error ? (
          <div className="mt-3 text-sm text-muted">
            {error}{" "}
            <a href="/billing" className="text-accent underline">
              View billing
            </a>
          </div>
        ) : (
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>On Hand</th>
              <th>Threshold</th>
            </tr>
          </thead>
          <tbody>
            {data?.lowStockItems?.map((item) => (
              <tr key={item.sku}>
                <td>{item.sku}</td>
                <td>{item.name}</td>
                <td>{item.on_hand}</td>
                <td>{item.low_stock_threshold}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      <div className="panel">
        <h3>Inventory Valuation by Category</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {advanced?.valuation?.map((row) => (
              <tr key={row.category}>
                <td>{row.category}</td>
                <td>${row.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3>Stock Movement (Last 30 Days)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Net Change</th>
            </tr>
          </thead>
          <tbody>
            {advanced?.movementLast30?.map((row) => (
              <tr key={row.date}>
                <td>{row.date}</td>
                <td>{row.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3>Aging Inventory (No Movement 30+ Days)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>On Hand</th>
              <th>Days Since Movement</th>
            </tr>
          </thead>
          <tbody>
            {advanced?.aging?.map((row) => (
              <tr key={row.sku}>
                <td>{row.sku}</td>
                <td>{row.name}</td>
                <td>{row.category}</td>
                <td>{row.on_hand}</td>
                <td>{row.days_since_movement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
