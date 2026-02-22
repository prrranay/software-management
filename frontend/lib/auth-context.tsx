"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api, setAccessToken } from "./api";

export type Role = "ADMIN" | "EMPLOYEE" | "CLIENT";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  clientCompanyId: string | null;
};

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
        });
        if (!resp.ok) {
          setAccessToken(null);
          setUser(null);
          return;
        }
        const data = (await resp.json()) as {
          accessToken: string;
          user: User;
        };
        if (cancelled) return;
        setToken(data.accessToken);
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        // ignore, unauthenticated
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const resp = await api.post<{ accessToken: string; user: User }>(
        "/auth/login",
        { email, password },
      );
      setToken(resp.data.accessToken);
      setAccessToken(resp.data.accessToken);
      setUser(resp.data.user);
      toast.success("Logged in");
      if (resp.data.user.role === "ADMIN") router.push("/admin/dashboard");
      else if (resp.data.user.role === "EMPLOYEE")
        router.push("/employee/projects");
      else router.push("/client/projects");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message?.[0] ??
        err?.response?.data?.message ??
        "Login failed";
      toast.error(String(msg));
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      setToken(null);
      setAccessToken(null);
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

