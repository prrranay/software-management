"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MessagesPanel } from "@/components/messages-panel";

type ChatPartner = {
  id: string;
  name: string;
  role: string;
  category?: string;
};

type Project = {
  id: string;
  client: { id: string; name: string };
};

export default function EmployeeMessagesPage() {
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);

  // Fetch eligible chat partners
  const { data: allPartners, isLoading } = useQuery({
    queryKey: ["employee", "partners"],
    queryFn: async () => {
      const { data } = await api.get<ChatPartner[]>("/messages/partners");
      return data;
    },
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 md:gap-6">
      <div className={`flex flex-col space-y-4 ${selectedPartner ? 'hidden md:flex md:w-72' : 'flex-1 md:w-72'}`}>
        <h1 className="text-2xl font-semibold text-slate-100">Messages</h1>
        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/50">
          <div className="divide-y divide-slate-800">
            {(allPartners || []).map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPartner(p)}
                className={`flex w-full flex-col px-4 py-3 text-left transition-all hover:bg-slate-800/50 ${selectedPartner?.id === p.id ? "bg-slate-800/80 ring-1 ring-emerald-500/30" : ""
                  }`}
              >
                <div className="text-sm font-semibold text-slate-100">{p.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] items-center uppercase tracking-widest text-slate-500">
                    {p.role}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-700" />
                  <span className="text-[10px] text-emerald-500 font-medium">
                    {p.category}
                  </span>
                </div>
              </button>
            ))}
            {(allPartners || []).length === 0 && !isLoading && (
              <div className="p-8 text-center text-xs text-slate-500 italic">
                No eligible chat partners found.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 flex-col min-w-0 min-h-0 ${selectedPartner ? 'flex' : 'hidden md:flex'}`}>
        {selectedPartner ? (
          <div className="flex h-full flex-col space-y-4 min-h-0">
            <div className="flex items-center gap-3 md:gap-4 rounded-2xl border border-slate-800 bg-slate-900 px-4 md:px-6 py-4 shadow-xl shrink-0">
              <button
                onClick={() => setSelectedPartner(null)}
                className="md:hidden rounded-full p-2 border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">
                {selectedPartner.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-slate-100 truncate">{selectedPartner.name}</div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-tight truncate">
                  {selectedPartner.category} — Chat Secure
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <MessagesPanel peerId={selectedPartner.id} />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/10">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 font-medium">Select a user to start a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
