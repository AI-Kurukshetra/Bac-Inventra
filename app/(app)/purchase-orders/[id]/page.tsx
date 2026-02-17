"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function PurchaseOrderEditPage() {
  const params = useParams<{ id: string }>();
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
      const [supRes, poRes] = await Promise.all([
        apiFetch("/api/suppliers"),
        apiFetch(`/api/purchase-orders?id=${params.id}`)
      ]);
      const supData = await supRes.json();
      const poData = await poRes.json();

      if (supRes.ok) {
        setSuppliers((supData.data || []).map((s: any) => s.name));
      }
      if (!poRes.ok) {
        setError(poData.error || "Failed to load");
        return;
      }
      const p = poData.data;
      setForm({
        reference: p.reference || "",
        supplier_name: p.supplier_name || "",
        status: p.status || "draft",
        total_amount: String(p.total_amount ?? 0)
      });
    };
    load();
  }, [params.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await apiFetch("/api/purchase-orders", {
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
    router.push("/purchase-orders");
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Edit Purchase Order</h1>
        <p className="muted">Update purchase order details.</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <input className="input" placeholder="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        <div>
          <input
            className="input"
            list="supplier-list"
            placeholder="Supplier"
            value={form.supplier_name}
            onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
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
        <button className="button" type="submit" disabled={loading}>Update</button>
      </form>
    </div>
  );
}