"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function SalesOrderEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [customers, setCustomers] = useState<string[]>([]);
  const [form, setForm] = useState({
    reference: "",
    customer_name: "",
    status: "draft",
    total_amount: "0"
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [custRes, soRes] = await Promise.all([
        apiFetch("/api/customers"),
        apiFetch(`/api/sales-orders?id=${params.id}`)
      ]);
      const custData = await custRes.json();
      const soData = await soRes.json();

      if (custRes.ok) {
        setCustomers((custData.data || []).map((c: any) => c.name));
      }
      if (!soRes.ok) {
        setError(soData.error || "Failed to load");
        return;
      }
      const s = soData.data;
      setForm({
        reference: s.reference || "",
        customer_name: s.customer_name || "",
        status: s.status || "draft",
        total_amount: String(s.total_amount ?? 0)
      });
    };
    load();
  }, [params.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await apiFetch("/api/sales-orders", {
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
    router.push("/sales-orders");
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Edit Sales Order</h1>
        <p className="muted">Update sales order details.</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <input className="input" placeholder="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        <div>
          <input
            className="input"
            list="customer-list"
            placeholder="Customer"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
          />
          <datalist id="customer-list">
            {customers.map((c) => (
              <option key={c} value={c} />
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