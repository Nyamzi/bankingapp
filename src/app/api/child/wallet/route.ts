import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.child]);
  if (auth.error || !auth.payload) return auth.error;

  const childProfile = await prisma.childProfile.findUnique({
    where: { childUserId: auth.payload.userId },
    include: {
      wallet: true,
      savingsGoals: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!childProfile?.wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  return NextResponse.json({
    wallet: {
      balance: Number(childProfile.wallet.balance),
      totalEarned: Number(childProfile.wallet.totalEarned),
      totalSpent: Number(childProfile.wallet.totalSpent),
    },
    savingsGoals: childProfile.savingsGoals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      status: goal.status,
      targetDate: goal.targetDate,
    })),
  });
}