"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  category_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  low_stock_threshold: number;
};

export default function ProductsListPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/api/products");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load");
    } else {
      setRows(data.data || []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    const ok = window.confirm("Are you sure you want to delete this product?");
    if (!ok) return;
    const res = await apiFetch(`/api/products?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to delete");
      return;
    }
    await load();
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1>Products</h1>
            <p className="muted">Manage products list.</p>
          </div>
          <Link className="button" href="/products/new">Add Product</Link>
        </div>
      </div>
      <div className="panel">
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div className="muted">Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Low Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.sku}</td>
                  <td>{row.name}</td>
                  <td>{row.category_name}</td>
                  <td>{row.quantity}</td>
                  <td>${Number(row.unit_price).toFixed(2)}</td>
                  <td>{row.low_stock_threshold}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        href={`/products/${row.id}`}
                        className="button secondary"
                        title="Edit"
                        aria-label="Edit"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path
                            d="M15.232 5.232l3.536 3.536M4 20h4l10.5-10.5a2.5 2.5 0 0 0-3.536-3.536L4 16v4z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                      <button
                        className="button secondary"
                        onClick={() => remove(row.id)}
                        title="Delete"
                        aria-label="Delete"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path
                            d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}