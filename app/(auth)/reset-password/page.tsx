"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) {
        setMessage("Reset link is invalid or expired. Please request a new one.");
      }
    };
    check();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage(null);
    const { error } = await supabaseBrowser.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    setMessage("Password updated. Redirecting to sign in...");
    setTimeout(() => router.push("/login"), 1200);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <section className="panel w-full max-w-md">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="muted text-sm mt-1">Enter your new password.</p>

        <form className="form mt-6" onSubmit={submit}>
          <div>
            <label className="text-sm font-medium">New password</label>
            <input
              className="input mt-2 w-full"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm password</label>
            <input
              className="input mt-2 w-full"
              placeholder="••••••••"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {message && (
            <div className={message.includes("error") ? "error" : "muted"}>{message}</div>
          )}

          <button className="button w-full" type="submit" disabled={loading}>
            Update password
          </button>
        </form>
      </section>
    </main>
  );
}
