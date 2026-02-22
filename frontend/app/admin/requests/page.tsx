"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

type ServiceRequest = {
  id: string;
  status: string;
  details?: string | null;
  client: { id: string; name: string };
  service: { id: string; name: string };
};

async function fetchRequests(): Promise<ServiceRequest[]> {
  const { data } = await api.get<ServiceRequest[]>("/service-requests");
  return data;
}

export default function AdminRequestsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "requests"],
    queryFn: fetchRequests,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/service-requests/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      toast.success("Request approved and project created");
      qc.invalidateQueries({ queryKey: ["admin", "requests"] });
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
    onError: () => toast.error("Failed to approve request"),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Service requests</h1>
      {isLoading && <div className="text-sm text-slate-400">Loading...</div>}
      {!isLoading && !data?.length && (
        <div className="text-sm text-slate-400">No requests.</div>
      )}
      <div className="space-y-2">
        {data?.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
          >
            <div>
              <div className="font-medium">
                {r.service.name} for {r.client.name}
              </div>
              <div className="text-xs text-slate-400">
                Status: {r.status}{" "}
                {r.details && <span className="ml-1">— {r.details}</span>}
              </div>
            </div>
            <button
              disabled={r.status === "APPROVED" || approveMutation.isPending}
              onClick={() => approveMutation.mutate(r.id)}
              className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
            >
              {r.status === "APPROVED" ? "Approved" : "Approve"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

