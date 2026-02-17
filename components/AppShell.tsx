"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { apiFetch } from "@/lib/apiFetch";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/customers", label: "Customers" },
  { href: "/locations", label: "Locations" },
  { href: "/stock-adjustments", label: "Stock Adjustments" },
  { href: "/purchase-orders", label: "Purchase Orders" },
  { href: "/sales-orders", label: "Sales Orders" },
  { href: "/reports", label: "Reports" }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [billingAlert, setBillingAlert] = useState<null | {
    message: string;
    severity: "warning" | "danger";
  }>(null);

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch("/api/me");
      const data = await res.json();
      if (res.ok) setRole(data.data?.role || null);
      const { data: userData } = await supabaseBrowser.auth.getUser();
      setUserEmail(userData.user?.email || "");

      const billingRes = await apiFetch("/api/billing/status");
      const billingJson = await billingRes.json();
      if (billingRes.ok && billingJson?.data?.plan && billingJson?.data?.usage) {
        const limits = billingJson.data.plan.limits || {};
        const usage = billingJson.data.usage || {};
        let found: { message: string; severity: "warning" | "danger" } | null = null;
        Object.entries(limits).forEach(([key, value]) => {
          if (typeof value !== "number") return;
          const current = Number(usage[key] || 0);
          if (current >= value) {
            found = {
              severity: "danger",
              message: `Plan limit reached for ${key.replace(/_/g, " ")} (${current}/${value}).`
            };
            return;
          }
          const ratio = value > 0 ? current / value : 0;
          if (!found && ratio >= 0.8) {
            found = {
              severity: "warning",
              message: `You are nearing the ${key.replace(/_/g, " ")} limit (${current}/${value}).`
            };
          }
        });
        setBillingAlert(found);
      }
    };
    load();
  }, []);

  const signOut = async () => {
    await supabaseBrowser.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="container">
      {billingAlert && (
        <div className={`banner ${billingAlert.severity}`}>
          <div className="banner-text">{billingAlert.message}</div>
          {(role === "admin" || role === "owner") && (
            <button
              className="button secondary"
              onClick={() => (window.location.href = "/billing")}
            >
              Upgrade
            </button>
          )}
        </div>
      )}
      <header className="header flex-nowrap">
        <div className="brand">
          <img
            src="/bac-inventra-logo.svg"
            alt="Bac Inventra"
            className="h-7 w-auto"
          />
        </div>
        <div className="flex items-center gap-4 min-w-0 flex-nowrap">
          <nav className="nav whitespace-nowrap overflow-x-auto max-w-[60vw]">
          {navItems.map((item) => (
            <Link
              key={item.href}
                href={item.href}
                style={{
                  color: pathname === item.href ? "var(--accent)" : "inherit",
                  fontWeight: pathname === item.href ? 600 : 500
                }}
              >
              {item.label}
            </Link>
          ))}
          {(role === "admin" || role === "owner") && (
            <Link
              href="/orgs"
              style={{
                color: pathname === "/orgs" ? "var(--accent)" : "inherit",
                fontWeight: pathname === "/orgs" ? 600 : 500
              }}
            >
              Organization
            </Link>
          )}
          {(role === "admin" || role === "owner") && (
            <Link
              href="/billing"
              style={{
                color: pathname === "/billing" ? "var(--accent)" : "inherit",
                fontWeight: pathname === "/billing" ? 600 : 500
              }}
            >
              Billing
            </Link>
          )}
          {(role === "admin" || role === "owner") && (
            <Link
              href="/users"
                style={{
                  color: pathname === "/users" ? "var(--accent)" : "inherit",
                  fontWeight: pathname === "/users" ? 600 : 500
                }}
              >
                Users
              </Link>
            )}
          {(role === "admin" || role === "owner") && (
            <Link
              href="/audit-logs"
              style={{
                color: pathname === "/audit-logs" ? "var(--accent)" : "inherit",
                fontWeight: pathname === "/audit-logs" ? 600 : 500
              }}
            >
              Audit Logs
            </Link>
          )}
          </nav>
          <div className="relative">
            <button
              className="button secondary flex items-center gap-2"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f5f4] text-accent">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                <path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[80vw] rounded-lg border border-border bg-white shadow-soft z-20">
                <div className="px-3 py-2 text-xs text-muted">Signed in as</div>
                <div className="px-3 pb-2 text-sm font-medium truncate" title={userEmail || "-"}>
                  {userEmail || "-"}
                </div>
                <div className="border-t border-border" />
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#f7f4ee]"
                  onClick={() => {
                    setMenuOpen(false);
                    window.location.href = "/profile";
                  }}
                >
                  Profile
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#f7f4ee]"
                  onClick={signOut}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div style={{ marginTop: 24 }}>{children}</div>
    </div>
  );
}
