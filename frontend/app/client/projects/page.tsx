"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Project = {
    id: string;
    name: string;
    status: string;
    service?: { name: string };
};

export default function ClientProjectsPage() {
    const { user } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ["client", "projects", user?.clientCompanyId],
        queryFn: async () => {
            if (!user?.clientCompanyId) return [];
            const { data } = await api.get<Project[]>(`/clients/${user.clientCompanyId}/projects`);
            return data;
        },
        enabled: !!user?.clientCompanyId,
    });

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">My Projects</h1>
            {isLoading && <div className="text-sm text-slate-400">Loading...</div>}
            <div className="space-y-3">
                {data?.map((p) => (
                    <div
                        key={p.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-slate-100">{p.name}</div>
                                {p.service?.name && (
                                    <div className="text-xs text-slate-400">{p.service.name}</div>
                                )}
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' :
                                p.status === 'IN_PROGRESS' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-700 text-slate-300'
                                }`}>
                                {p.status}
                            </span>
                        </div>
                    </div>
                ))}
                {!isLoading && !data?.length && (
                    <div className="text-sm text-slate-400">No projects found.</div>
                )}
            </div>
        </div>
    );
}
