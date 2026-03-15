import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getAuthFromCookieHeader } from "@/lib/auth";

export function requireAuth(request: NextRequest) {
  const payload = getAuthFromCookieHeader(request.headers.get("cookie"));
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      payload: null,
    };
  }
  return { error: null, payload };
}

export function requireRole(request: NextRequest, roles: Role[]) {
  const auth = requireAuth(request);
  if (auth.error || !auth.payload) return auth;
  if (!roles.includes(auth.payload.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      payload: null,
    };
  }
  return auth;
}