"use client";

import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: string;
};
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

export default function ClientRequestsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [serviceId, setServiceId] = useState("");
  const [details, setDetails] = useState("");

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data } = await api.get<Service[]>("/services");
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user?.clientCompanyId) {
        throw new Error("No client company set");
      }
      const { data } = await api.post("/service-requests", {
        serviceId,
        clientId: user.clientCompanyId,
        details,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Request created");
      setServiceId("");
      setDetails("");
      qc.invalidateQueries({ queryKey: ["client", "requests"] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message?.[0] ??
        err?.response?.data?.message ??
        "Failed to create request";
      toast.error(String(msg));
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!serviceId) return toast.error("Please select a service");
    mutation.mutate();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Service requests</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded border border-slate-800 bg-slate-900 p-4 text-sm">
        <div>
          <label className="block text-xs font-medium text-slate-300">
            Select Service
          </label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500"
          >
            <option value="">Choose a service...</option>
            {services?.map((s: Service) => (
              <option key={s.id} value={s.id}>{s.name} - ${parseFloat(s.price).toFixed(2)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300">
            Details
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-sky-500"
            rows={3}
            placeholder="Describe your request..."
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {mutation.isPending ? "Submitting..." : "Submit request"}
        </button>
      </form>
    </div>
  );
}

