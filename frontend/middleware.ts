import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const PUBLIC_PATHS = ["/login", "/"];

const PROTECTED_PREFIXES = ["/admin", "/employee", "/client"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);
  const isProtected = PROTECTED_PREFIXES.some((p) =>
    pathname.toLowerCase().startsWith(p),
  );

  if (!isProtected || isPublic) {
    return NextResponse.next();
  }

  const cookie = req.headers.get("cookie") ?? "";
  if (!cookie.includes("refreshToken")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Attempt to refresh session server-side; if it fails, redirect to login.
  const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { cookie },
  });

  if (!refreshRes.ok) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/client/:path*"],
};

