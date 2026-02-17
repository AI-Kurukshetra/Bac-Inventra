"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function SupplierNewPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", contact_name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }
    const res = await apiFetch("/api/suppliers", {
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
    router.push("/suppliers");
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Add Supplier</h1>
        <p className="muted">Create a new supplier.</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <input
          className="input"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input className="input" placeholder="Contact Name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        {error && <div className="error">{error}</div>}
        <button className="button" type="submit" disabled={loading}>Save</button>
      </form>
    </div>
  );
}
