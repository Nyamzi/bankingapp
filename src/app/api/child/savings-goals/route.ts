import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const goalSchema = z.object({
  title: z.string().min(2),
  targetAmount: z.number().positive(),
  targetDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.child]);
  if (auth.error || !auth.payload) return auth.error;

  const child = await prisma.childProfile.findUnique({
    where: { childUserId: auth.payload.userId },
    include: { savingsGoals: { orderBy: { createdAt: "desc" } } },
  });

  if (!child) {
    return NextResponse.json({ error: "Child profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    savingsGoals: child.savingsGoals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      status: goal.status,
      targetDate: goal.targetDate,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, [Role.child]);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid savings goal payload" }, { status: 400 });
  }

  const child = await prisma.childProfile.findUnique({
    where: { childUserId: auth.payload.userId },
  });

  if (!child) {
    return NextResponse.json({ error: "Child profile not found" }, { status: 404 });
  }

  const goal = await prisma.savingsGoal.create({
    data: {
      childId: child.id,
      title: parsed.data.title,
      targetAmount: parsed.data.targetAmount,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : undefined,
    },
  });

  return NextResponse.json({
    message: "Savings goal created",
    goal: {
      id: goal.id,
      title: goal.title,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      status: goal.status,
      targetDate: goal.targetDate,
    },
  });
}