import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  fullName: z.string().min(3).max(120),
  nin: z.string().regex(/^[A-Za-z0-9]{8,20}$/),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/),
  email: z.string().email(),
});

export async function PATCH(request: NextRequest) {
  const auth = requireRole(request, [Role.parent]);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid account profile" }, { status: 400 });
  }

  const normalizedNin = parsed.data.nin.toUpperCase();
  const [emailUser, ninUser, phoneUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } }),
    prisma.user.findUnique({ where: { nin: normalizedNin }, select: { id: true } }),
    prisma.user.findUnique({ where: { phoneNumber: parsed.data.phoneNumber }, select: { id: true } }),
  ]);

  if (emailUser && emailUser.id !== auth.payload.userId) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  if (ninUser && ninUser.id !== auth.payload.userId) {
    return NextResponse.json({ error: "NIN already registered" }, { status: 409 });
  }

  if (phoneUser && phoneUser.id !== auth.payload.userId) {
    return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: auth.payload.userId },
    data: {
      fullName: parsed.data.fullName,
      nin: normalizedNin,
      phoneNumber: parsed.data.phoneNumber,
      email: parsed.data.email,
    },
    select: {
      fullName: true,
      nin: true,
      phoneNumber: true,
      email: true,
    },
  });

  return NextResponse.json({
    message: "Account details updated",
    profile: updatedUser,
  });
}