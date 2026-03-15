import { NextRequest, NextResponse } from "next/server";
import { Role, TransactionStatus } from "@prisma/client";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.parent]);
  if (auth.error || !auth.payload) return auth.error;

  const pending = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.pending,
      child: { parentId: auth.payload.userId },
    },
    include: {
      child: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    pending: pending.map((item) => ({
      id: item.id,
      childId: item.childId,
      childName: item.child.nickname,
      amount: Number(item.amount),
      type: item.type,
      status: item.status,
      description: item.description,
      createdAt: item.createdAt,
    })),
  });
}