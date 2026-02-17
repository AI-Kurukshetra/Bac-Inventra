"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { apiFetch } from "@/lib/apiFetch";

type Role = "owner" | "admin" | "manager" | "staff";

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
      "/transfers",
      "/labels",
      "/purchase-orders/new",
      "/sales-orders/new",
      "/stock-adjustments/new",
      "/audit-logs"
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
      owner: () => true,
      admin: () => true,
      manager: (path: string) =>
        !path.startsWith("/users") &&
        !path.startsWith("/orgs") &&
        !path.startsWith("/billing") &&
        !path.startsWith("/audit-logs"),
      staff: (path: string) => {
        if (staffBlockedPrefixes.some((p) => path.startsWith(p))) return false;
        if (staffBlockedIdSegments.some((p) => path.startsWith(p))) return false;
        if (path.startsWith("/orgs")) return false;
        if (path.startsWith("/billing")) return false;
        if (path.startsWith("/audit-logs")) return false;
        if (path.startsWith("/transfers")) return false;
        if (path.startsWith("/labels")) return false;
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
      const orgId = json.data?.orgId || null;
      if (!orgId && pathname !== "/orgs") {
        if (role === "admin" || role === "owner") {
          router.replace("/orgs");
        } else {
          router.replace("/login");
        }
        return;
      }
      const allowed = rolePermissions[role]?.(pathname) ?? false;
      if (!allowed) {
        router.replace("/dashboard");
        return;
      }
      setReady(true);
    };
    checkSession();
  }, [router, pathname, rolePermissions]);

  if (!ready) return null;
  return <>{children}</>;
}
