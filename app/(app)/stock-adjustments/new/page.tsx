"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function StockAdjustmentNewPage() {
  const router = useRouter();
  const [products, setProducts] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [form, setForm] = useState({
    product_sku: "",
    location_name: "",
    quantity_delta: "0",
    reason: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [prodRes, locRes] = await Promise.all([
        apiFetch("/api/products"),
        apiFetch("/api/locations")
      ]);
      const prodData = await prodRes.json();
      const locData = await locRes.json();
      if (prodRes.ok) {
        setProducts((prodData.data || []).map((p: any) => p.sku));
      }
      if (locRes.ok) {
        setLocations((locData.data || []).map((l: any) => l.name));
      }
    };
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!form.product_sku.trim() || !form.location_name.trim()) {
      setError("Product and Location are required");
      setLoading(false);
      return;
    }
    if (!form.quantity_delta.trim()) {
      setError("Quantity change is required");
      setLoading(false);
      return;
    }
    const res = await apiFetch("/api/stock-adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create");
      setLoading(false);
      return;
    }
    router.push("/stock-adjustments");
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Add Stock Adjustment</h1>
        <p className="muted">Record a stock change.</p>
      </div>
      <form className="panel form" onSubmit={submit}>
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
            list="location-list"
            placeholder="Location"
            value={form.location_name}
            onChange={(e) => setForm({ ...form, location_name: e.target.value })}
            required
          />
          <datalist id="location-list">
            {locations.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <input
          className="input"
          type="number"
          placeholder="Quantity Change"
          value={form.quantity_delta}
          onChange={(e) => setForm({ ...form, quantity_delta: e.target.value })}
          required
        />
        <input className="input" placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        {error && <div className="error">{error}</div>}
        <button className="button" type="submit" disabled={loading}>Save</button>
      </form>
    </div>
  );
}
