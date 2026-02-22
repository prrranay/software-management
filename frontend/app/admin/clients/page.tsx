"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

type ClientCompany = {
    id: string;
    name: string;
};

export default function AdminClientsPage() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState<ClientCompany | null>(null);
    const [name, setName] = useState("");

    const { data: companies, isLoading } = useQuery({
        queryKey: ["admin", "companies"],
        queryFn: async () => {
            const { data } = await api.get<ClientCompany[]>("/clients");
            return data;
        },
    });

    const resetForm = () => {
        setName("");
        setEditingCompany(null);
        setShowForm(false);
    };

    const createMutation = useMutation({
        mutationFn: async (payload: any) => api.post("/clients", payload),
        onSuccess: () => {
            toast.success("Company created");
            qc.invalidateQueries({ queryKey: ["admin", "companies"] });
            resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message?.[0] || "Error creating company"),
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: any) => api.patch(`/clients/${editingCompany?.id}`, payload),
        onSuccess: () => {
            toast.success("Company updated");
            qc.invalidateQueries({ queryKey: ["admin", "companies"] });
            resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message?.[0] || "Error updating company"),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/clients/${id}`),
        onSuccess: () => {
            toast.success("Company deleted");
            qc.invalidateQueries({ queryKey: ["admin", "companies"] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Error deleting company"),
    });

    const handleEdit = (company: ClientCompany) => {
        setEditingCompany(company);
        setName(company.name);
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCompany) {
            updateMutation.mutate({ name });
        } else {
            createMutation.mutate({ name });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Client Companies</h1>
                <button
                    onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                    {showForm ? "Cancel" : "Add Company"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-medium text-slate-400">Company Name</label>
                        <input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                            placeholder="e.g. Acme Corp"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                            {editingCompany ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {companies?.map((c) => (
                    <div
                        key={c.id}
                        className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm transition-all hover:border-slate-700"
                    >
                        <div className="flex items-center justify-between">
                            <div className="font-semibold text-slate-100">{c.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{c.id.split('-')[0]}...</div>
                        </div>
                        <div className="mt-4 flex gap-2 border-t border-slate-800 pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(c)}
                                className="flex-1 rounded bg-slate-800 py-1 text-xs font-semibold text-sky-400 hover:bg-slate-750"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => { if (confirm("Delete this company?")) deleteMutation.mutate(c.id); }}
                                className="flex-1 rounded bg-slate-800 py-1 text-xs font-semibold text-rose-400 hover:bg-slate-750"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {isLoading && <div className="p-8 text-center text-slate-500 col-span-full">Loading companies...</div>}
                {!isLoading && !companies?.length && (
                    <div className="p-8 text-center text-slate-500 col-span-full italic">No client companies found.</div>
                )}
            </div>
        </div>
    );
}
