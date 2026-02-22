"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

type Employee = {
  id: string;
  name: string;
};

type ClientCompany = {
  id: string;
  name: string;
};

type Assignment = {
  employee: { id: string; name: string; email: string };
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  clientId: string;
  client: { name: string };
  assignments: Assignment[];
};

export default function AdminProjectsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");

  // Assignment state
  const [assigningToProjectId, setAssigningToProjectId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: async () => {
      const { data } = await api.get<Project[]>("/projects");
      return data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["admin", "clients"],
    queryFn: async () => {
      const { data } = await api.get<ClientCompany[]>("/clients");
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["admin", "employees"],
    queryFn: async () => {
      const { data } = await api.get<{ items: Employee[] }>("/users?role=EMPLOYEE");
      return data.items;
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setClientId("");
    setEditingProject(null);
    setShowForm(false);
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/projects", payload),
    onSuccess: () => {
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message?.[0] || "Error creating project"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => api.patch(`/projects/${editingProject?.id}`, payload),
    onSuccess: () => {
      toast.success("Project updated");
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message?.[0] || "Error updating project"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      toast.success("Project deleted");
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
    onError: () => toast.error("Error deleting project"),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ projectId, employeeIds }: { projectId: string; employeeIds: string[] }) =>
      api.post(`/projects/${projectId}/assign`, { employeeIds }),
    onSuccess: () => {
      toast.success("Employee assigned");
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
      setEmployeeId("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message?.[0] || "Error assigning employee"),
  });

  const unassignMutation = useMutation({
    mutationFn: async ({ projectId, employeeId }: { projectId: string; employeeId: string }) =>
      api.delete(`/projects/${projectId}/assign/${employeeId}`),
    onSuccess: () => {
      toast.success("Employee unassigned");
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error unassigning employee"),
  });

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || "");
    setClientId(project.clientId);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, description, clientId };
    if (editingProject) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects Management</h1>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          {showForm ? "Cancel" : "Create Project"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Project Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Client Company</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              >
                <option value="">Select Client...</option>
                {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
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
            {editingProject ? "Update Project" : "Create Project"}
          </button>
        </form>
      )}

      <div className="grid gap-6">
        {projects?.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{p.name}</h3>
                <p className="text-sm text-slate-400">Client: {p.client.name}</p>
                {p.description && <p className="mt-2 text-xs text-slate-500 max-w-2xl">{p.description}</p>}
                <div className="mt-2 inline-flex items-center rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 uppercase">
                  {p.status}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => { if (confirm("Delete this project?")) deleteMutation.mutate(p.id); }}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Assignments</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.assignments.map((a) => (
                  <div
                    key={a.employee.id}
                    className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs"
                  >
                    <span className="text-slate-200">{a.employee.name}</span>
                    <button
                      onClick={() => unassignMutation.mutate({ projectId: p.id, employeeId: a.employee.id })}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {!p.assignments.length && (
                  <span className="text-xs text-slate-500 italic">No employees assigned.</span>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <select
                  value={assigningToProjectId === p.id ? employeeId : ""}
                  onChange={(e) => {
                    setAssigningToProjectId(p.id);
                    setEmployeeId(e.target.value);
                  }}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500"
                >
                  <option value="">Assign Employee...</option>
                  {employees?.filter(emp => !p.assignments.some(a => a.employee.id === emp.id)).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => assignMutation.mutate({ projectId: p.id, employeeIds: [employeeId] })}
                  disabled={!employeeId || (assignMutation.isPending && assigningToProjectId === p.id)}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="p-8 text-center text-slate-500">Loading projects...</div>}
        {!isLoading && !projects?.length && (
          <div className="p-8 text-center text-slate-500">No projects found.</div>
        )}
      </div>
    </div>
  );
}
