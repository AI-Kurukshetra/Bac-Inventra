"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function CategoryEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch(`/api/categories?id=${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load");
        return;
      }
      setName(data.data?.name || "");
      setDescription(data.data?.description || "");
    };
    load();
  }, [params.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }
    const res = await apiFetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id, name, description })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update");
      setLoading(false);
      return;
    }
    router.push("/categories");
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Edit Category</h1>
        <p className="muted">Update category details.</p>
      </div>
      <form className="panel form" onSubmit={submit}>
        <input
          className="input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <div className="error">{error}</div>}
        <button className="button" type="submit" disabled={loading}>Update</button>
      </form>
    </div>
  );
}
