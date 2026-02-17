"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function OrgsPage() {
  const [org, setOrg] = useState<any>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await apiFetch("/api/orgs");
    const data = await res.json();
    if (res.ok) {
      setOrg(data.data);
      if (data.data) {
        setName(data.data.name || "");
        setAddress(data.data.address || "");
        setWebsite(data.data.website || "");
        setEmail(data.data.email || "");
        setPhone(data.data.phone || "");
        setLogoUrl(data.data.logo_url || "");
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (!name.trim()) {
      setMessage("Organization name is required");
      setLoading(false);
      return;
    }
    const res = await apiFetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to create org");
      setLoading(false);
      return;
    }
    setOrg(data.data);
    setLoading(false);
  };

  const updateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (!name.trim()) {
      setMessage("Organization name is required");
      setLoading(false);
      return;
    }

    let nextLogoUrl = logoUrl;
    if (logoFile) {
      const fileExt = logoFile.name.split(".").pop() || "png";
      const filePath = `orgs/${org?.id || "unknown"}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabaseBrowser.storage
        .from("org-logos")
        .upload(filePath, logoFile, { upsert: true });
      if (uploadError) {
        setMessage(uploadError.message);
        setLoading(false);
        return;
      }
      const { data } = supabaseBrowser.storage.from("org-logos").getPublicUrl(filePath);
      nextLogoUrl = data.publicUrl;
    }

    const res = await apiFetch("/api/orgs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address, website, email, phone, logo_url: nextLogoUrl })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to update org");
      setLoading(false);
      return;
    }
    setOrg(data.data);
    setLoading(false);
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Organization</h1>
        <p className="muted">Create and manage your organization.</p>
      </div>

      {!org ? (
        <form className="panel form" onSubmit={createOrg}>
          <div>
            <label className="text-sm font-medium">Organization name</label>
            <input
              className="input mt-2"
              placeholder="Acme Inc"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {message && <div className="error">{message}</div>}
          <button className="button" type="submit" disabled={loading}>Create Organization</button>
        </form>
      ) : (
        <form className="panel form" onSubmit={updateOrg}>
          <div className="text-sm text-muted">Organization</div>
          <div className="text-lg font-semibold mt-1">{org.name}</div>
          <div className="text-sm text-muted mt-2">ID: {org.id}</div>

          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                className="input mt-2 w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Website</label>
              <input className="input mt-2 w-full" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-2">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input className="input mt-2 w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input className="input mt-2 w-full" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Address</label>
            <input className="input mt-2 w-full" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Logo</label>
            <input
              className="input mt-2 w-full"
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
            {logoUrl && (
              <div className="mt-3 flex items-center gap-3">
                <img src={logoUrl} alt="Org logo" className="h-12 w-12 rounded-lg object-cover border border-border" />
                <div className="text-sm text-muted">Current logo</div>
              </div>
            )}
          </div>

          {message && <div className="error">{message}</div>}
          <button className="button" type="submit" disabled={loading}>Update Organization</button>
        </form>
      )}
    </div>
  );
}
