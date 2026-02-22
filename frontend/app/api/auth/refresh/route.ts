import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      cookie,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = (await res.json()) as { accessToken: string };
  return NextResponse.json({ accessToken: data.accessToken });
}

