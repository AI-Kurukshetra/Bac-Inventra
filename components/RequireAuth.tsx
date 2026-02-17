"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { apiFetch } from "@/lib/apiFetch";

type Role = "admin" | "manager" | "staff";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const rolePermissions = useMemo(() => {
    const staffBlockedPrefixes = [
      "/users",
      "/categories/new",
      "/products/new",
      "/suppliers/new",
      "/customers/new",
      "/locations/new",
      "/purchase-orders/new",
      "/sales-orders/new",
      "/stock-adjustments/new"
    ];
    const staffBlockedIdSegments = [
      "/categories/",
      "/products/",
      "/suppliers/",
      "/customers/",
      "/locations/",
      "/purchase-orders/",
      "/sales-orders/",
      "/stock-adjustments/"
    ];

    return {
      admin: () => true,
      manager: (path: string) => !path.startsWith("/users"),
      staff: (path: string) => {
        if (staffBlockedPrefixes.some((p) => path.startsWith(p))) return false;
        if (staffBlockedIdSegments.some((p) => path.startsWith(p))) return false;
        return true;
      }
    } as Record<Role, (path: string) => boolean>;
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const res = await apiFetch("/api/me");
      const json = await res.json();
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      const role = (json.data?.role || "staff") as Role;
      const allowed = rolePermissions[role]?.(pathname) ?? false;
      if (!allowed) {
        router.replace("/dashboard");
        return;
      }
      setReady(true);
    };
    checkSession();
  }, [router, pathname, rolePermissions]);

  if (!ready) return <div className="container">Checking session...</div>;
  return <>{children}</>;
}
