import { NextRequest, NextResponse } from "next/server";
import { Role, TransactionStatus, TransactionType } from "@prisma/client";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.admin]);
  if (auth.error || !auth.payload) return auth.error;

  const [
    totalParents,
    totalChildren,
    totalTransactions,
    pendingTransactions,
    approvedTransactions,
    totalLessons,
    totalQuizzes,
    earnCount,
    spendCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.parent } }),
    prisma.user.count({ where: { role: Role.child } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: TransactionStatus.pending } }),
    prisma.transaction.count({ where: { status: TransactionStatus.approved } }),
    prisma.lesson.count(),
    prisma.quiz.count(),
    prisma.transaction.count({ where: { type: TransactionType.earn } }),
    prisma.transaction.count({ where: { type: TransactionType.spend } }),
  ]);

  return NextResponse.json({
    totalParents,
    totalChildren,
    totalTransactions,
    pendingTransactions,
    approvedTransactions,
    totalLessons,
    totalQuizzes,
    earnCount,
    spendCount,
  });
}