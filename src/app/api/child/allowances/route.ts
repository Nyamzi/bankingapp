import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.child]);
  if (auth.error || !auth.payload) return auth.error;

  const child = await prisma.childProfile.findUnique({
    where: { childUserId: auth.payload.userId },
    include: {
      allowanceSchedules: {
        where: { isActive: true },
        orderBy: [{ availableOn: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!child) {
    return NextResponse.json({ error: "Child profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    allowances: child.allowanceSchedules.map((allowance) => ({
      id: allowance.id,
      title: allowance.title,
      amount: Number(allowance.amount),
      availableOn: allowance.availableOn.toISOString(),
      notes: allowance.notes,
      isActive: allowance.isActive,
    })),
  });
}