"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type UserRow = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  role: "owner" | "admin" | "manager" | "staff";
  full_name: string;
};

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");

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
        <h3>Invite user</h3>
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!inviteEmail.trim()) {
              setError("Email is required");
              return;
            }
            const res = await apiFetch("/api/invites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error || "Invite failed");
              return;
            }
            setInviteEmail("");
            await load();
          }}
        >
          <input
            className="input"
            placeholder="email@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            type="email"
            required
          />
          <select
            className="select"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            <option value="owner">owner</option>
            <option value="admin">admin</option>
            <option value="manager">manager</option>
            <option value="staff">staff</option>
          </select>
          <button className="button" type="submit">Send Invite</button>
        </form>
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
                      <option value="owner">owner</option>
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
