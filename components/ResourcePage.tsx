"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

export type Column = { key: string; label: string };
export type Field = {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

export default function ResourcePage({
  title,
  resource,
  columns,
  fields,
  enableEditDelete
}: {
  title: string;
  resource: string;
  columns: Column[];
  fields: Field[];
  enableEditDelete?: boolean;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await apiFetch(`/api/${resource}`);
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
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: Record<string, string> = {};
    fields.forEach((field) => {
      payload[field.key] = form[field.key] || "";
    });
    if (editingId) {
      payload.id = editingId;
    }
    const res = await apiFetch(`/api/${resource}`, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create");
      return;
    }
    setForm({});
    setEditingId(null);
    await load();
  };

  const startEdit = (row: any) => {
    const nextForm: Record<string, string> = {};
    fields.forEach((field) => {
      const value = row[field.key];
      nextForm[field.key] = value === undefined || value === null ? "" : String(value);
    });
    setForm(nextForm);
    setEditingId(row.id);
  };

  const remove = async (row: any) => {
    const res = await apiFetch(`/api/${resource}?id=${row.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to delete");
      return;
    }
    await load();
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>{title}</h1>
        <p className="muted">Create and review records.</p>
      </div>
      <div className="grid grid-2">
        <form className="panel form" onSubmit={submit}>
          <h3>{editingId ? `Edit ${title}` : `Create ${title}`}</h3>
          {fields.map((field) =>
            field.type === "select" ? (
              <select
                key={field.key}
                className="select"
                value={form[field.key] || ""}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              >
                <option value="">{field.placeholder || `Select ${field.label}`}</option>
                {(field.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === "searchable" ? (
              <div key={field.key}>
                <input
                  className="input"
                  list={`${field.key}-list`}
                  placeholder={field.placeholder || field.label}
                  value={form[field.key] || ""}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                />
                <datalist id={`${field.key}-list`}>
                  {(field.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </datalist>
              </div>
            ) : (
              <input
                key={field.key}
                className="input"
                type={field.type || "text"}
                placeholder={field.placeholder || field.label}
                value={form[field.key] || ""}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              />
            )
          )}
          {error && <div className="error">{error}</div>}
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button className="button" type="submit">{editingId ? "Update" : "Save"}</button>
            {editingId && (
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({});
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="panel">
          <h3>Records</h3>
          {loading ? (
            <div className="muted">Loading...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  {enableEditDelete && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((col) => (
                      <td key={col.key}>{row[col.key]}</td>
                    ))}
                    {enableEditDelete && (
                      <td>
                        <div className="flex gap-2">
                          <button className="button secondary" onClick={() => startEdit(row)}>
                            Edit
                          </button>
                          <button className="button secondary" onClick={() => remove(row)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
