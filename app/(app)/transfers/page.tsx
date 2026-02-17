"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type TransferRow = {
  id: string;
  reference: string;
  product_sku: string;
  product_name: string;
  from_location: string;
  to_location: string;
  quantity: number;
  status: string;
  created_at: string;
};

export default function TransfersPage() {
  const [rows, setRows] = useState<TransferRow[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [form, setForm] = useState({
    reference: "",
    product_sku: "",
    from_location: "",
    to_location: "",
    quantity: "1"
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [listRes, prodRes, locRes] = await Promise.all([
      apiFetch("/api/transfers"),
      apiFetch("/api/products"),
      apiFetch("/api/locations")
    ]);
    const listData = await listRes.json();
    const prodData = await prodRes.json();
    const locData = await locRes.json();
    if (listRes.ok) setRows(listData.data || []);
    if (prodRes.ok) setProducts((prodData.data || []).map((p: any) => p.sku));
    if (locRes.ok) setLocations((locData.data || []).map((l: any) => l.name));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!form.product_sku.trim() || !form.from_location.trim() || !form.to_location.trim()) {
      setError("Product and locations are required");
      setLoading(false);
      return;
    }
    if (!form.quantity.trim() || Number(form.quantity) <= 0) {
      setError("Quantity must be greater than 0");
      setLoading(false);
      return;
    }
    const res = await apiFetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create transfer");
      setLoading(false);
      return;
    }
    setForm({ reference: "", product_sku: "", from_location: "", to_location: "", quantity: "1" });
    setLoading(false);
    await load();
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Transfers</h1>
        <p className="muted">Move stock between locations.</p>
      </div>

      <form className="panel form" onSubmit={submit}>
        <input
          className="input"
          placeholder="Reference"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
        />
        <div>
          <input
            className="input"
            list="product-list"
            placeholder="Product SKU"
            value={form.product_sku}
            onChange={(e) => setForm({ ...form, product_sku: e.target.value })}
            required
          />
          <datalist id="product-list">
            {products.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <div>
          <input
            className="input"
            list="from-location-list"
            placeholder="From Location"
            value={form.from_location}
            onChange={(e) => setForm({ ...form, from_location: e.target.value })}
            required
          />
          <datalist id="from-location-list">
            {locations.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <div>
          <input
            className="input"
            list="to-location-list"
            placeholder="To Location"
            value={form.to_location}
            onChange={(e) => setForm({ ...form, to_location: e.target.value })}
            required
          />
          <datalist id="to-location-list">
            {locations.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <input
          className="input"
          type="number"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          required
        />
        {error && <div className="error">{error}</div>}
        <button className="button" type="submit" disabled={loading}>Create Transfer</button>
      </form>

      <div className="panel">
        <h3>Transfer History</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Product</th>
              <th>From</th>
              <th>To</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.reference || "-"}</td>
                <td>{row.product_name || row.product_sku}</td>
                <td>{row.from_location}</td>
                <td>{row.to_location}</td>
                <td>{row.quantity}</td>
                <td>{row.status}</td>
                <td>{new Date(row.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
