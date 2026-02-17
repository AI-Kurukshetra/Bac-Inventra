"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function PurchaseOrderNewPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [form, setForm] = useState({
    reference: "",
    supplier_name: "",
    status: "draft",
    total_amount: "0"
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch("/api/suppliers");
      const data = await res.json();
      if (res.ok) {
        setSuppliers((data.data || []).map((s: any) => s.name));
      }
    };
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!form.reference.trim() || !form.supplier_name.trim()) {
      setError("Reference and Supplier are required");
      setLoading(false);
      return;
    }
    const res = await apiFetch("/api/purchase-orders", {
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
    router.push("/purchase-orders");
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Add Purchase Order</h1>
        <p className="muted">Create a new purchase order.</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <input
          className="input"
          placeholder="Reference"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
          required
        />
        <div>
          <input
            className="input"
            list="supplier-list"
            placeholder="Supplier"
            value={form.supplier_name}
            onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
            required
          />
          <datalist id="supplier-list">
            {suppliers.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <input className="input" placeholder="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
        <input className="input" type="number" placeholder="Total Amount" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
        {error && <div className="error">{error}</div>}
        <button className="button" type="submit" disabled={loading}>Save</button>
      </form>
    </div>
  );
}
