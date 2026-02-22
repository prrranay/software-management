"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

type Project = {
  id: string;
  name: string;
  status: string;
  client: { id: string; name: string };
};

export default function EmployeeProjectsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["employee", "projects"],
    queryFn: async () => {
      const { data } = await api.get<Project[]>("/employees/me/projects");
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/projects/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["employee", "projects"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My projects</h1>
      {isLoading && <div className="text-sm text-slate-400">Loading...</div>}
      <div className="space-y-3">
        {data?.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm"
          >
            <div>
              <div className="font-semibold text-slate-100">{p.name}</div>
              <div className="text-xs text-slate-400">
                Client: {p.client.name} — Status: <span className="font-medium text-sky-400">{p.status}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => statusMutation.mutate({ id: p.id, status: "IN_PROGRESS" })}
                disabled={p.status === "IN_PROGRESS" || statusMutation.isPending}
                className="rounded bg-sky-600/20 px-3 py-1 text-xs font-semibold text-sky-400 hover:bg-sky-600/30 disabled:opacity-40"
              >
                In Progress
              </button>
              <button
                onClick={() => statusMutation.mutate({ id: p.id, status: "DONE" })}
                disabled={p.status === "DONE" || statusMutation.isPending}
                className="rounded bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-40"
              >
                Done
              </button>
            </div>
          </div>
        ))}
        {!isLoading && !data?.length && (
          <div className="text-sm text-slate-400">No projects assigned.</div>
        )}
      </div>
    </div>
  );
}

