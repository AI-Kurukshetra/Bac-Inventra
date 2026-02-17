"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function SalesOrderEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [customers, setCustomers] = useState<string[]>([]);
  const [approval, setApproval] = useState<{
    approval_status: string;
    approved_by_name?: string;
    approved_at?: string | null;
  } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
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
      setApproval({
        approval_status: s.approval_status || "pending",
        approved_by_name: s.approved_by_name || "",
        approved_at: s.approved_at || null
      });

      const historyRes = await apiFetch(
        `/api/audit-logs?entity_type=sales_order&entity_id=${params.id}`
      );
      const historyData = await historyRes.json();
      if (historyRes.ok) {
        setHistory(historyData.data || []);
      }
    };
    load();
  }, [params.id]);

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
        <button className="button" type="submit" disabled={loading}>Update</button>
      </form>

      <div className="panel">
        <h3>Approval</h3>
        <div className="mt-2 flex items-center gap-3">
          <span className={`status ${approval?.approval_status || "pending"}`}>
            {approval?.approval_status || "pending"}
          </span>
          {approval?.approved_by_name && (
            <span className="text-sm text-muted">By {approval.approved_by_name}</span>
          )}
          {approval?.approved_at && (
            <span className="text-sm text-muted">
              {new Date(approval.approved_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="panel">
        <h3>Approval History</h3>
        {history.length === 0 ? (
          <div className="text-sm text-muted mt-2">No approval actions yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>By</th>
                <th>At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id}>
                  <td>{row.action}</td>
                  <td>{row.actor_name || "-"}</td>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
