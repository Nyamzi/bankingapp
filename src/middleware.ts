import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

type MiddlewareTokenPayload = {
  role?: "parent" | "child" | "admin";
  exp?: number;
};

function decodeTokenPayload(token: string): MiddlewareTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as MiddlewareTokenPayload;

    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isAuthPage = path === "/login" || path === "/register";
  if (isAuthPage) {
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (!token) return NextResponse.next();

    const payload = decodeTokenPayload(token);
    if (!payload) return NextResponse.next();

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!path.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeTokenPayload(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path.startsWith("/dashboard/parent") && payload.role !== "parent") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (path.startsWith("/dashboard/child") && payload.role !== "child") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (path.startsWith("/dashboard/admin") && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};