"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    clientCompanyId?: string | null;
};

type ClientCompany = {
    id: string;
    name: string;
};

export default function AdminUsersPage() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("EMPLOYEE");
    const [clientCompanyId, setClientCompanyId] = useState("");

    const { data: users, isLoading } = useQuery({
        queryKey: ["admin", "users"],
        queryFn: async () => {
            const { data } = await api.get<{ items: User[] }>("/users");
            return data.items;
        },
    });

    const { data: companies } = useQuery({
        queryKey: ["admin", "companies"],
        queryFn: async () => {
            const { data } = await api.get<ClientCompany[]>("/clients");
            return data;
        },
    });

    const resetForm = () => {
        setName("");
        setEmail("");
        setPassword("");
        setRole("EMPLOYEE");
        setClientCompanyId("");
        setEditingUser(null);
        setShowForm(false);
    };

    const createMutation = useMutation({
        mutationFn: async (payload: any) => api.post("/users", payload),
        onSuccess: () => {
            toast.success("User created");
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
            resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message?.[0] || "Error creating user"),
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: any) => api.patch(`/users/${editingUser?.id}`, payload),
        onSuccess: () => {
            toast.success("User updated");
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
            resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message?.[0] || "Error updating user"),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/users/${id}`),
        onSuccess: () => {
            toast.success("User deactivated");
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
        },
        onError: () => toast.error("Error deleting user"),
    });

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setClientCompanyId(user.clientCompanyId || "");
        setPassword(""); // Don't show password
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = { name, email, role };
        if (role === "CLIENT") payload.clientCompanyId = clientCompanyId || null;

        if (editingUser) {
            if (password) payload.password = password;
            updateMutation.mutate(payload);
        } else {
            payload.password = password;
            createMutation.mutate(payload);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Users Management</h1>
                <button
                    onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                    {showForm ? "Cancel" : "Add User"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm sm:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">Full Name</label>
                        <input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">Email Address</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">
                            {editingUser ? "New Password (Optional)" : "Password"}
                        </label>
                        <input
                            required={!editingUser}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                        >
                            <option value="ADMIN">ADMIN</option>
                            <option value="EMPLOYEE">EMPLOYEE</option>
                            <option value="CLIENT">CLIENT</option>
                        </select>
                    </div>
                    {role === "CLIENT" && (
                        <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-medium text-slate-400">Client Company</label>
                            <select
                                required
                                value={clientCompanyId}
                                onChange={(e) => setClientCompanyId(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                            >
                                <option value="">Select Company...</option>
                                {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="sm:col-span-2">
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                            {editingUser ? "Update User" : "Create User"}
                        </button>
                    </div>
                </form>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow">
                <table className="min-w-full divide-y divide-slate-800">
                    <thead className="bg-slate-950/50 text-xs font-medium uppercase text-slate-400">
                        <tr>
                            <th className="px-6 py-3 text-left">User</th>
                            <th className="px-6 py-3 text-left">Role</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                        {users?.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-800/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-100">{u.name}</div>
                                    <div className="text-xs text-slate-500">{u.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold">
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                        }`}>
                                        {u.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="space-x-2 px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleEdit(u)}
                                        className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { if (confirm("Are you sure?")) deleteMutation.mutate(u.id); }}
                                        className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {isLoading && <div className="p-8 text-center text-slate-500">Loading users...</div>}
                {!isLoading && !users?.length && (
                    <div className="p-8 text-center text-slate-500">No users found.</div>
                )}
            </div>
        </div>
    );
}
