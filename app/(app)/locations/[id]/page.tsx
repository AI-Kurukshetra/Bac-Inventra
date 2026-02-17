"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function LocationEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch(`/api/locations?id=${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load");
        return;
      }
      setForm({
        name: data.data?.name || "",
        description: data.data?.description || ""
      });
    };
    load();
  }, [params.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }
    const res = await apiFetch("/api/locations", {
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
    router.push("/locations");
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Edit Location</h1>
        <p className="muted">Update location details.</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <input
          className="input"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {error && <div className="error">{error}</div>}
        <button className="button" type="submit" disabled={loading}>Update</button>
      </form>
    </div>
  );
}
