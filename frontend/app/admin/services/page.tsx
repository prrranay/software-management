"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

type Service = {
    id: string;
    name: string;
    description: string | null;
    price: string;
};

export default function AdminServicesPage() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");

    const { data: services, isLoading } = useQuery({
        queryKey: ["admin", "services"],
        queryFn: async () => {
            const { data } = await api.get<Service[]>("/services");
            return data;
        },
    });

    const resetForm = () => {
        setName("");
        setDescription("");
        setPrice("");
        setEditingService(null);
        setShowForm(false);
    };

    const createMutation = useMutation({
        mutationFn: async (payload: any) => api.post("/services", payload),
        onSuccess: () => {
            toast.success("Service created");
            qc.invalidateQueries({ queryKey: ["admin", "services"] });
            resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message?.[0] || "Error creating service"),
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: any) => api.patch(`/services/${editingService?.id}`, payload),
        onSuccess: () => {
            toast.success("Service updated");
            qc.invalidateQueries({ queryKey: ["admin", "services"] });
            resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message?.[0] || "Error updating service"),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/services/${id}`),
        onSuccess: () => {
            toast.success("Service deleted");
            qc.invalidateQueries({ queryKey: ["admin", "services"] });
        },
        onError: () => toast.error("Error deleting service"),
    });

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setName(service.name);
        setDescription(service.description || "");
        setPrice(service.price);
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { name, description, price: parseFloat(price) };
        if (editingService) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Services</h1>
                <button
                    onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                    {showForm ? "Cancel" : "Add Service"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">Service Name</label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">Price ($)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                        {editingService ? "Update Service" : "Create Service"}
                    </button>
                </form>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services?.map((s) => (
                    <div
                        key={s.id}
                        className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm transition-all hover:border-slate-700"
                    >
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="font-semibold text-slate-100">{s.name}</div>
                                <div className="text-sm font-bold text-emerald-400">
                                    ${parseFloat(s.price).toFixed(2)}
                                </div>
                            </div>
                            {s.description && (
                                <p className="mt-2 text-xs text-slate-400 line-clamp-3">{s.description}</p>
                            )}
                        </div>
                        <div className="mt-4 flex gap-2 border-t border-slate-800 pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(s)}
                                className="flex-1 rounded bg-slate-800 py-1 text-xs font-semibold text-sky-400 hover:bg-slate-750"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => { if (confirm("Delete this service?")) deleteMutation.mutate(s.id); }}
                                className="flex-1 rounded bg-slate-800 py-1 text-xs font-semibold text-rose-400 hover:bg-slate-750"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {isLoading && <div className="p-8 text-center text-slate-500 col-span-full">Loading services...</div>}
                {!isLoading && !services?.length && (
                    <div className="p-8 text-center text-slate-500 col-span-full">No services found.</div>
                )}
            </div>
        </div>
    );
}
