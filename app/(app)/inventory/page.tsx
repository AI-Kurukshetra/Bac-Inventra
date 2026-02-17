"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type InventoryRow = {
  sku: string;
  name: string;
  category_name: string;
  on_hand: number;
  low_stock_threshold: number;
  unit_price: number;
};

export default function InventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch("/api/inventory");
      const data = await res.json();
      if (res.ok) {
        setRows(data.data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Inventory</h1>
        <p className="muted">Current on-hand quantities and stock status.</p>
      </div>
      <div className="panel">
        {loading ? (
          <div className="muted">Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>On Hand</th>
                <th>Low Stock</th>
                <th>Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.sku}>
                  <td>{row.sku}</td>
                  <td>{row.name}</td>
                  <td>{row.category_name}</td>
                  <td>{row.on_hand}</td>
                  <td>{row.low_stock_threshold}</td>
                  <td>${Number(row.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}