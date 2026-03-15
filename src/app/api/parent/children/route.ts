import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const createChildSchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().min(2),
  age: z.number().int().min(5).max(17),
});

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.parent]);
  if (auth.error || !auth.payload) return auth.error;

  const children = await prisma.childProfile.findMany({
    where: { parentId: auth.payload.userId },
    include: {
      childUser: true,
      wallet: true,
      budgets: { where: { isActive: true }, take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    children: children.map((child) => ({
      id: child.id,
      nickname: child.nickname,
      age: child.age,
      email: child.childUser.email,
      wallet: child.wallet
        ? {
            balance: Number(child.wallet.balance),
            totalEarned: Number(child.wallet.totalEarned),
            totalSpent: Number(child.wallet.totalSpent),
          }
        : null,
      activeSpendingLimit: child.budgets[0] ? Number(child.budgets[0].monthlyLimit) : null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, [Role.parent]);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = createChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid child payload" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const result = await prisma.$transaction(async (tx) => {
    const childUser = await tx.user.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        passwordHash,
        role: Role.child,
      },
    });

    const profile = await tx.childProfile.create({
      data: {
        nickname: parsed.data.nickname,
        age: parsed.data.age,
        parentId: auth.payload.userId,
        childUserId: childUser.id,
      },
    });

    await tx.wallet.create({
      data: {
        childId: profile.id,
      },
    });

    return profile;
  });

  return NextResponse.json({ message: "Child account created", childId: result.id }, { status: 201 });
}