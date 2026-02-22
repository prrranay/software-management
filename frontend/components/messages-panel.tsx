import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; email: string };
  receiver: { id: string; name: string; email: string };
};

type ConversationResponse = {
  items: Message[];
  total: number;
  page: number;
  limit: number;
};

export function MessagesPanel({ peerId }: { peerId: string }) {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", { peerId }],
    queryFn: async (): Promise<ConversationResponse> => {
      const { data } = await api.get<ConversationResponse>("/messages", {
        params: { peerId, limit: 100 },
      });
      return data;
    },
    enabled: !!peerId,
    refetchInterval: 5000, // Poll every 5s for new messages
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.items]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Message>("/messages", {
        receiverId: peerId,
        content,
      });
      return data;
    },
    onSuccess: () => {
      setContent("");
      qc.invalidateQueries({ queryKey: ["messages", { peerId }] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message?.[0] ??
        err?.response?.data?.message ??
        "Failed to send message";
      toast.error(String(msg));
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sendMutation.isPending) return;
    sendMutation.mutate();
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/50 text-sm overflow-hidden min-h-0">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-4 scroll-smooth min-h-0"
      >
        {isLoading && !data && (
          <div className="flex items-center justify-center h-full">
            <div className="text-xs text-slate-500 animate-pulse">Loading conversation...</div>
          </div>
        )}
        {data?.items?.slice().reverse().map((m) => {
          const isMe = m.senderId !== peerId;
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe
                ? 'bg-sky-600 text-white rounded-tr-none'
                : 'bg-slate-800 text-slate-100 rounded-tl-none'
                }`}>
                <div className="text-sm">{m.content}</div>
                <div className={`mt-1 text-[10px] ${isMe ? 'text-sky-200' : 'text-slate-500'}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        {data?.items?.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full text-xs text-slate-500 italic">
            No messages yet. Say hello!
          </div>
        )}
      </div>
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-slate-800 bg-slate-950 p-3 shrink-0"
      >
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as any);
            }
          }}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 placeholder:text-slate-600"
          placeholder="Type your message..."
        />
        <button
          type="submit"
          disabled={!content.trim() || sendMutation.isPending}
          className="rounded-xl bg-sky-600 p-2 text-white hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 transition-colors"
        >
          {sendMutation.isPending ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925a1.5 1.5 0 001.071 1.05l7.959 1.785a.25.25 0 010 .482l-7.959 1.785a1.5 1.5 0 00-1.071 1.05l-1.414 4.925a.75.75 0 00.826.95 44.522 44.522 0 0015.544-7.468.75.75 0 000-1.2h.002c-4.439-3.413-9.858-5.83-15.544-7.468z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

