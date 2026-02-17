"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password reset email sent. Please check your inbox.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <section className="panel w-full max-w-md">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="muted text-sm mt-1">Enter your email to receive a reset link.</p>

        <form className="form mt-6" onSubmit={submit}>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="input mt-2 w-full"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          {message && (
            <div className={message.includes("error") ? "error" : "muted"}>{message}</div>
          )}

          <button className="button w-full" type="submit" disabled={loading}>
            Send reset link
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link className="text-accent font-semibold" href="/login">Back to sign in</Link>
        </div>
      </section>
    </main>
  );
}
