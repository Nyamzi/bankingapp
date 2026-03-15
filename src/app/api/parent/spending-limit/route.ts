import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const spendingLimitSchema = z.object({
  childId: z.string().min(1),
  monthlyLimit: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const auth = requireRole(request, [Role.parent]);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = spendingLimitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid spending limit payload" }, { status: 400 });
  }

  const child = await prisma.childProfile.findFirst({
    where: { id: parsed.data.childId, parentId: auth.payload.userId },
  });

  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.budget.updateMany({
      where: { childId: child.id, isActive: true },
      data: { isActive: false, periodEnd: new Date() },
    });

    await tx.budget.create({
      data: {
        childId: child.id,
        monthlyLimit: parsed.data.monthlyLimit,
        isActive: true,
      },
    });
  });

  return NextResponse.json({ message: "Spending limit updated" });
}