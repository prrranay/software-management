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
        // 1. Try restoring from localStorage first (works cross-origin)
        const savedToken = localStorage.getItem("accessToken");
        const savedUser = localStorage.getItem("user");
        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser) as User;
          setToken(savedToken);
          setAccessToken(savedToken);
          setUser(parsedUser);
          if (!cancelled) setLoading(false);
          return;
        }

        // 2. Fallback: try restoring from backend's refresh cookie directly
        const refreshResp = await api.post<{ accessToken: string }>("/auth/refresh");
        const newAccessToken = refreshResp.data.accessToken;

        // Temporarily set it so the profile call succeeds
        setAccessToken(newAccessToken);

        const profileResp = await api.get<User>("/auth/profile");
        const newUser = profileResp.data;

        if (cancelled) return;
        setToken(newAccessToken);
        setUser(newUser);
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("user", JSON.stringify(newUser));
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
      localStorage.setItem("accessToken", resp.data.accessToken);
      localStorage.setItem("user", JSON.stringify(resp.data.user));
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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
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

