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
      {/* your existing JSX here */}
    </main>
  );
}