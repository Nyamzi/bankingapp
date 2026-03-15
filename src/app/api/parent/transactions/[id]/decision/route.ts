import { NextRequest, NextResponse } from "next/server";
import { Role, TransactionStatus, TransactionType } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(request, [Role.parent]);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision payload" }, { status: 400 });
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: params.id,
      status: TransactionStatus.pending,
      child: { parentId: auth.payload.userId },
    },
    include: { wallet: true },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Pending transaction not found" }, { status: 404 });
  }

  const decision = parsed.data.decision as TransactionStatus;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedTx = await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: decision,
        approvedById: auth.payload.userId,
        reviewedAt: new Date(),
      },
    });

    if (decision === TransactionStatus.approved) {
      const amount = transaction.amount;
      if (transaction.type === TransactionType.earn) {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: transaction.wallet.balance + amount,
            totalEarned: transaction.wallet.totalEarned + amount,
          },
        });
      } else {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: transaction.wallet.balance - amount,
            totalSpent: transaction.wallet.totalSpent + amount,
          },
        });
      }
    }

    return updatedTx;
  });

  return NextResponse.json({ message: `Transaction ${updated.status}` });
}