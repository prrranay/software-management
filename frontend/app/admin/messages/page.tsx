"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MessagesPanel } from "@/components/messages-panel";

type UserPreview = {
  id: string;
  name: string;
  role: string;
};

export default function AdminMessagesPage() {
  const [selectedUser, setSelectedUser] = useState<UserPreview | null>(null);
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users", "messaging"],
    queryFn: async () => {
      const { data } = await api.get<{ items: UserPreview[] }>("/users");
      return data.items;
    },
  });

  const filteredUsers = users?.filter(u =>
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())) &&
    u.role !== "ADMIN" // Usually message employees or clients
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 md:gap-6">
      <div className={`flex flex-col space-y-4 ${selectedUser ? 'hidden md:flex md:w-80' : 'flex-1 md:w-80'}`}>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
            placeholder="Search users to message..."
          />
        </div>
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50">
          {isLoading && <div className="p-4 text-xs text-slate-500">Loading users...</div>}
          <div className="divide-y divide-slate-800">
            {filteredUsers?.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`flex w-full flex-col items-start px-4 py-3 text-left transition-colors hover:bg-slate-800/50 ${selectedUser?.id === u.id ? "bg-slate-800/80" : ""
                  }`}
              >
                <div className="text-sm font-medium text-slate-100">{u.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">{u.role}</div>
              </button>
            ))}
            {!isLoading && !filteredUsers?.length && (
              <div className="p-4 text-center text-xs text-slate-500">No users found.</div>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 flex-col min-w-0 min-h-0 ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
        {selectedUser ? (
          <div className="flex h-full flex-col space-y-4 min-h-0">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 md:px-5 py-3 shadow-sm shrink-0">
              <button
                onClick={() => setSelectedUser(null)}
                className="md:hidden rounded-full p-2 border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <div className="h-8 w-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xs shrink-0">
                {selectedUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100 truncate">{selectedUser.name}</div>
                <div className="text-[10px] text-slate-500 uppercase truncate">{selectedUser.role}</div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <MessagesPanel peerId={selectedUser.id} />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
            <div className="text-center">
              <p className="text-sm text-slate-500">Select a user to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
