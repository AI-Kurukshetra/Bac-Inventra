"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type PurchaseOrder = {
  id: string;
  reference: string;
  supplier_name: string;
  status: string;
  approval_status?: string;
  total_amount: number;
};

export default function PurchaseOrdersListPage() {
  const [rows, setRows] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/api/purchase-orders");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load");
    } else {
      setRows(data.data || []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const loadRole = async () => {
      const res = await apiFetch("/api/me");
      const json = await res.json();
      if (res.ok) setRole(json.data?.role || null);
    };
    loadRole();
  }, []);

  const remove = async (id: string) => {
    const ok = window.confirm("Are you sure you want to delete this purchase order?");
    if (!ok) return;
    const res = await apiFetch(`/api/purchase-orders?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to delete");
      return;
    }
    await load();
  };

  const approve = async (id: string, action: "approve" | "reject") => {
    const res = await apiFetch("/api/purchase-orders/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update approval");
      return;
    }
    await load();
  };

  const canApprove = role === "admin" || role === "manager" || role === "owner";

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1>Purchase Orders</h1>
            <p className="muted">Manage purchase orders.</p>
          </div>
          <Link className="button" href="/purchase-orders/new">Add Purchase Order</Link>
        </div>
      </div>
      <div className="panel">
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div className="muted">Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Approval</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.reference}</td>
                  <td>{row.supplier_name}</td>
                  <td>{row.status}</td>
                  <td>
                    <span className={`status ${row.approval_status || "pending"}`}>
                      {row.approval_status || "pending"}
                    </span>
                  </td>
                  <td>${Number(row.total_amount).toFixed(2)}</td>
                  <td>
                    <div className="flex gap-2">
                      {canApprove && (row.approval_status || "pending") === "pending" && (
                        <>
                          <button
                            className="button secondary"
                            onClick={() => approve(row.id, "approve")}
                            title="Approve"
                            aria-label="Approve"
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                              <path
                                d="M5 12l4 4L19 6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            className="button secondary"
                            onClick={() => approve(row.id, "reject")}
                            title="Reject"
                            aria-label="Reject"
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                              <path
                                d="M6 6l12 12M18 6l-12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                      <Link
                        href={`/purchase-orders/${row.id}`}
                        className="button secondary"
                        title="Edit"
                        aria-label="Edit"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path
                            d="M15.232 5.232l3.536 3.536M4 20h4l10.5-10.5a2.5 2.5 0 0 0-3.536-3.536L4 16v4z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                      <button
                        className="button secondary"
                        onClick={() => remove(row.id)}
                        title="Delete"
                        aria-label="Delete"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path
                            d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
