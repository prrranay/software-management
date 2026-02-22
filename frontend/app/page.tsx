"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (user.role === "ADMIN") {
      router.replace("/admin/dashboard");
    } else if (user.role === "EMPLOYEE") {
      router.replace("/employee/projects");
    } else {
      router.replace("/client/projects");
    }
  }, [user, router]);

  return null;
}

