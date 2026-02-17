"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function PurchaseOrderEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [approval, setApproval] = useState<{
    approval_status: string;
    approved_by_name?: string;
    approved_at?: string | null;
  } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
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
      setApproval({
        approval_status: p.approval_status || "pending",
        approved_by_name: p.approved_by_name || "",
        approved_at: p.approved_at || null
      });

      const historyRes = await apiFetch(
        `/api/audit-logs?entity_type=purchase_order&entity_id=${params.id}`
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
    if (!form.reference.trim() || !form.supplier_name.trim()) {
      setError("Reference and Supplier are required");
      setLoading(false);
      return;
    }
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
