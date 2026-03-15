import { NextRequest, NextResponse } from "next/server";
import {
  Role,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const txSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["earn", "spend"]),
  description: z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.child]);
  if (auth.error || !auth.payload) return auth.error;

  const child = await prisma.childProfile.findUnique({
    where: { childUserId: auth.payload.userId },
    include: { wallet: true },
  });

  if (!child?.wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { walletId: child.wallet.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    transactions: transactions.map((tx) => ({
      id: tx.id,
      amount: Number(tx.amount),
      type: tx.type,
      status: tx.status,
      description: tx.description,
      createdAt: tx.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, [Role.child]);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = txSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid transaction payload" }, { status: 400 });
  }

  const child = await prisma.childProfile.findUnique({
    where: { childUserId: auth.payload.userId },
    include: {
      wallet: true,
      budgets: {
        where: { isActive: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!child?.wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const amount = parsed.data.amount;
  const type = parsed.data.type as TransactionType;

  let status: TransactionStatus = TransactionStatus.pending;
  if (type === TransactionType.earn) {
    status = TransactionStatus.approved;
  }

  const activeLimit = child.budgets[0] ? Number(child.budgets[0].monthlyLimit) : null;
  if (type === TransactionType.spend && activeLimit !== null && parsed.data.amount <= activeLimit) {
    status = TransactionStatus.approved;
  }

  const created = await prisma.$transaction(async (tx) => {
    const createdTx = await tx.transaction.create({
      data: {
        walletId: child.wallet!.id,
        childId: child.id,
        amount,
        type,
        status,
        description: parsed.data.description,
      },
    });

    if (status === TransactionStatus.approved) {
      if (type === TransactionType.earn) {
        await tx.wallet.update({
          where: { id: child.wallet!.id },
          data: {
            balance: child.wallet!.balance + amount,
            totalEarned: child.wallet!.totalEarned + amount,
          },
        });
      } else {
        await tx.wallet.update({
          where: { id: child.wallet!.id },
          data: {
            balance: child.wallet!.balance - amount,
            totalSpent: child.wallet!.totalSpent + amount,
          },
        });
      }
    }

    return createdTx;
  });

  return NextResponse.json(
    {
      message:
        created.status === TransactionStatus.pending
          ? "Transaction submitted for parent approval"
          : "Transaction recorded",
      transactionId: created.id,
      status: created.status,
    },
    { status: 201 }
  );
}