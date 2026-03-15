import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE, comparePassword, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await comparePassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  const redirectTo =
    user.role === "parent"
      ? "/dashboard/parent"
      : user.role === "child"
        ? "/dashboard/child"
        : "/dashboard/admin";

  const response = NextResponse.json({
    message: "Logged in",
    role: user.role,
    redirectTo,
  });

  response.cookies.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}