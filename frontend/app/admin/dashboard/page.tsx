"use client";

import { useAuth } from "@/lib/auth-context";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Stats {
  totalProjects: number;
  activeEmployees: number;
  activeClients: number;
  pendingRequests: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-slate-400">
          Welcome back, {user?.name}. Here&apos;s an overview of the platform.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Projects", value: stats?.totalProjects, color: "text-blue-400" },
          { label: "Active Employees", value: stats?.activeEmployees, color: "text-green-400" },
          { label: "Active Clients", value: stats?.activeClients, color: "text-purple-400" },
          { label: "Pending Requests", value: stats?.pendingRequests, color: "text-orange-400" },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-400">{stat.label}</p>
            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>
              {isLoading ? "..." : stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

