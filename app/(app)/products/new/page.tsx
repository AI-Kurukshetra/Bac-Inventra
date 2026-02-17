"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function ProductNewPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    category_name: "",
    description: "",
    quantity: "0",
    unit_price: "0",
    low_stock_threshold: "0"
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch("/api/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories((data.data || []).map((c: any) => c.name));
      }
    };
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await apiFetch("/api/products", {
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
    router.push("/products");
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Add Product</h1>
        <p className="muted">Create a new product.</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <input className="input" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div>
          <input
            className="input"
            list="category-list"
            placeholder="Category"
            value={form.category_name}
            onChange={(e) => setForm({ ...form, category_name: e.target.value })}
          />
          <datalist id="category-list">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        <input className="input" type="number" placeholder="Unit Price" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
        <input className="input" type="number" placeholder="Low Stock Threshold" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
        {error && <div className="error">{error}</div>}
        <button className="button" type="submit" disabled={loading}>Save</button>
      </form>
    </div>
  );
}