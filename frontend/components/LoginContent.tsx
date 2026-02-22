"use client";

import { FormEvent, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginContent() {
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("SecurePass123!");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === "ADMIN") router.push("/admin/dashboard");
      else if (user.role === "EMPLOYEE") router.push("/employee/projects");
      else router.push("/client/projects");
    }
  }, [user, authLoading, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setLoading(false);
    }
  };

  const redirect = searchParams.get("redirect");

  if (authLoading || user) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      <div suppressHydrationWarning className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="mb-2 text-xl font-semibold text-slate-50">Sign in</h1>
        {redirect && (
          <p className="mb-2 text-xs text-slate-400">
            You must sign in to access <span className="font-mono">{redirect}</span>
          </p>
        )}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-xs font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}