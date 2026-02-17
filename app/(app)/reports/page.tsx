"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type ReportData = {
  lowStockItems: { sku: string; name: string; on_hand: number; low_stock_threshold: number }[];
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch("/api/reports");
      const json = await res.json();
      setData(json.data);
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
      </div>
    </div>
  );
}