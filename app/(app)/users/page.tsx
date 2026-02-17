"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type UserRow = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  role: "admin" | "manager" | "staff";
  full_name: string;
};

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/api/users");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load users");
    } else {
      setRows(data.data || []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const now = useMemo(() => new Date(), []);

  const isBlocked = (row: UserRow) => {
    if (!row.banned_until) return false;
    return new Date(row.banned_until) > now;
  };

  const updateRole = async (id: string, role: string) => {
    const res = await apiFetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update role");
      return;
    }
    await load();
  };

  const toggleBlock = async (id: string, blocked: boolean) => {
    const res = await apiFetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update status");
      return;
    }
    await load();
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Users</h1>
        <p className="muted">Manage roles and access.</p>
      </div>
      <div className="panel">
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div className="muted">Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last Sign In</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.full_name || "-"}</td>
                  <td>{row.email}</td>
                  <td>
                    <select
                      className="select"
                      value={row.role}
                      onChange={(e) => updateRole(row.id, e.target.value)}
                    >
                      <option value="admin">admin</option>
                      <option value="manager">manager</option>
                      <option value="staff">staff</option>
                    </select>
                  </td>
                  <td>{row.last_sign_in_at ? new Date(row.last_sign_in_at).toLocaleString() : "-"}</td>
                  <td>{isBlocked(row) ? "Blocked" : "Active"}</td>
                  <td>
                    <button
                      className="button secondary"
                      onClick={() => toggleBlock(row.id, !isBlocked(row))}
                    >
                      {isBlocked(row) ? "Unblock" : "Block"}
                    </button>
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
