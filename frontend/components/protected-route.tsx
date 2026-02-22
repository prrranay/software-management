"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, Role } from "@/lib/auth-context";

type Props = {
  children: ReactNode;
  allowedRoles?: Role[];
};

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const url = new URL("/login", window.location.origin);
      url.searchParams.set("redirect", pathname);
      router.replace(url.toString());
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to a safe default based on role.
      if (user.role === "ADMIN") router.replace("/admin/dashboard");
      else if (user.role === "EMPLOYEE") router.replace("/employee/projects");
      else router.replace("/client/projects");
    }
  }, [user, loading, allowedRoles, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-300">
        Checking session...
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}

