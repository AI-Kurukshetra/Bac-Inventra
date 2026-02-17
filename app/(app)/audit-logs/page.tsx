"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type LogRow = {
  id: string;
  actor_name: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  created_at: string;
};

type UserRow = {
  id: string;
  full_name: string;
  email: string;
};

export default function AuditLogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    entity_type: "",
    action: "",
    actor_id: "",
    from: "",
    to: ""
  });

  const loadUsers = async () => {
    const res = await apiFetch("/api/users");
    const data = await res.json();
    if (res.ok) {
      setUsers((data.data || []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name || "",
        email: u.email || ""
      })));
    }
  };

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.entity_type) params.set("entity_type", filters.entity_type);
    if (filters.action) params.set("action", filters.action);
    if (filters.actor_id) params.set("actor_id", filters.actor_id);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const res = await apiFetch(`/api/audit-logs/list?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load audit logs");
    } else {
      setRows(data.data || []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
    load();
  }, []);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Audit Logs</h1>
        <p className="muted">Track approvals and key actions.</p>
      </div>

      <div className="panel">
        <h3>Filters</h3>
        <div className="grid grid-3">
          <select
            className="select"
            value={filters.entity_type}
            onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
          >
            <option value="">All entities</option>
            <option value="purchase_order">Purchase Order</option>
            <option value="sales_order">Sales Order</option>
            <option value="product">Product</option>
            <option value="category">Category</option>
            <option value="supplier">Supplier</option>
            <option value="customer">Customer</option>
            <option value="location">Location</option>
            <option value="stock_adjustment">Stock Adjustment</option>
            <option value="stock_transfer">Stock Transfer</option>
          </select>
          <select
            className="select"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">All actions</option>
            <option value="approve">approve</option>
            <option value="reject">reject</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="delete">delete</option>
          </select>
          <select
            className="select"
            value={filters.actor_id}
            onChange={(e) => setFilters({ ...filters, actor_id: e.target.value })}
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-2" style={{ marginTop: 12 }}>
          <input
            className="input"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
          <input
            className="input"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button className="button" onClick={load}>Apply</button>
          <button
            className="button secondary"
            onClick={() => {
              setFilters({ entity_type: "", action: "", actor_id: "", from: "", to: "" });
              setTimeout(load, 0);
            }}
          >
            Reset
          </button>
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
                <th>Action</th>
                <th>Entity</th>
                <th>Actor</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.action}</td>
                  <td>{row.entity_type}</td>
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
