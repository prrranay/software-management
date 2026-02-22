import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";

  const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { cookie },
  });
  if (!refreshRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { accessToken } = (await refreshRes.json()) as { accessToken: string };

  const profileRes = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await profileRes.json();

  return NextResponse.json({ accessToken, user });
}

