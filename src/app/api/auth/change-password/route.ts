import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { comparePassword, hashPassword } from "@/lib/auth";
import { requireAuth } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.payload.userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "New password must be different from current password" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ message: "Password changed successfully" });
}