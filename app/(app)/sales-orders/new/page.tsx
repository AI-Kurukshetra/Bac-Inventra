"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function SalesOrderNewPage() {
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
      const res = await apiFetch("/api/customers");
      const data = await res.json();
      if (res.ok) {
        setCustomers((data.data || []).map((c: any) => c.name));
      }
    };
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!form.reference.trim() || !form.customer_name.trim()) {
      setError("Reference and Customer are required");
      setLoading(false);
      return;
    }
    const res = await apiFetch("/api/sales-orders", {
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
    router.push("/sales-orders");
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Add Sales Order</h1>
        <p className="muted">Create a new sales order.</p>
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
            list="customer-list"
            placeholder="Customer"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            required
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
        <button className="button" type="submit" disabled={loading}>Save</button>
      </form>
    </div>
  );
}
