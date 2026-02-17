"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function ProductEditPage() {
  const params = useParams<{ id: string }>();
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
      const [catRes, prodRes] = await Promise.all([
        apiFetch("/api/categories"),
        apiFetch(`/api/products?id=${params.id}`)
      ]);
      const catData = await catRes.json();
      const prodData = await prodRes.json();

      if (catRes.ok) {
        setCategories((catData.data || []).map((c: any) => c.name));
      }
      if (!prodRes.ok) {
        setError(prodData.error || "Failed to load");
        return;
      }
      const p = prodData.data;
      setForm({
        sku: p.sku || "",
        name: p.name || "",
        category_name: p.category_name || "",
        description: p.description || "",
        quantity: String(p.quantity ?? 0),
        unit_price: String(p.unit_price ?? 0),
        low_stock_threshold: String(p.low_stock_threshold ?? 0)
      });
    };
    load();
  }, [params.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await apiFetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id, ...form })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update");
      setLoading(false);
      return;
    }
    router.push("/products");
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Edit Product</h1>
        <p className="muted">Update product details.</p>
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
        <button className="button" type="submit" disabled={loading}>Update</button>
      </form>
    </div>
  );
}