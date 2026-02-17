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

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch("/api/me");
      const data = await res.json();
      if (res.ok) setRole(data.data?.role || null);
      const { data: userData } = await supabaseBrowser.auth.getUser();
      setUserEmail(userData.user?.email || "");
    };
    load();
  }, []);

  const signOut = async () => {
    await supabaseBrowser.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="container">
      <header className="header flex-nowrap">
        <div className="brand">Bac Inventra</div>
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
            {role === "admin" && (
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
