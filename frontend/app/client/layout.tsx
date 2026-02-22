"use client";

import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { Sidebar } from "@/components/sidebar";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["CLIENT"]}>
      <div className="flex min-h-screen bg-slate-950 text-slate-50 flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">{children}</main>
      </div>
    </ProtectedRoute>
  );
}

