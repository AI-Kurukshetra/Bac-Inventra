"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabaseBrowser.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email to confirm the account.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-stretch">
        <div className="panel flex flex-col justify-between">
          <div>
            <div className="badge">Bac Inventra</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              Inventory management built for clarity.
            </h1>
            <p className="muted mt-3">
              Track products, stock, suppliers, and orders in one workspace.
            </p>
          </div>
          <div className="grid gap-3 mt-8">
            <div className="card">
              <div className="text-sm font-semibold">Operational visibility</div>
              <div className="muted text-sm">Low-stock alerts, inventory valuation, and trends.</div>
            </div>
            <div className="card">
              <div className="text-sm font-semibold">Team-ready access</div>
              <div className="muted text-sm">Secure sign-in for your staff and managers.</div>
            </div>
          </div>
        </div>

        <section className="panel">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-semibold">
                {mode === "signin" ? "Sign in" : "Create account"}
              </h2>
              <p className="muted text-sm mt-1">
                {mode === "signin"
                  ? "Welcome back. Access your inventory dashboard."
                  : "Start managing your inventory in minutes."}
              </p>
            </div>
            <div className="flex items-center rounded-full border border-border bg-white p-1">
              <button
                className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                  mode === "signin" ? "bg-accent text-white shadow-soft" : "text-ink"
                }`}
                onClick={() => setMode("signin")}
                type="button"
              >
                Sign In
              </button>
              <button
                className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                  mode === "signup" ? "bg-accent text-white shadow-soft" : "text-ink"
                }`}
                onClick={() => setMode("signup")}
                type="button"
              >
                Sign Up
              </button>
            </div>
          </div>

          <form
            className="form mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === "signin") {
                handleSignIn();
              } else {
                handleSignUp();
              }
            }}
          >
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
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                className="input mt-2 w-full"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <div className={message.includes("error") ? "error" : "muted"}>{message}</div>
            )}

            <button className="button w-full" type="submit" disabled={loading}>
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
            {mode === "signin" && (
              <div className="text-sm text-center">
                <a href="/forgot-password" className="text-accent font-semibold">
                  Forgot password?
                </a>
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
