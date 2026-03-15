import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  fullName: z.string().min(3).max(120),
  nin: z.string().regex(/^[A-Za-z0-9]{8,20}$/),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: parsed.data.email },
        { nin: parsed.data.nin.toUpperCase() },
        { phoneNumber: parsed.data.phoneNumber },
      ],
    },
  });

  if (existingUser) {
    if (existingUser.email === parsed.data.email) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    if (existingUser.nin === parsed.data.nin.toUpperCase()) {
      return NextResponse.json({ error: "NIN already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.create({
    data: {
      fullName: parsed.data.fullName,
      nin: parsed.data.nin.toUpperCase(),
      phoneNumber: parsed.data.phoneNumber,
      email: parsed.data.email,
      passwordHash,
      role: Role.parent,
    },
  });

  return NextResponse.json({ message: "Parent account created" }, { status: 201 });
}