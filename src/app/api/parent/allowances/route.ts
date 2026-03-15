import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const allowanceSchema = z.object({
  childId: z.string().min(1),
  title: z.string().min(2).max(120),
  amount: z.number().positive(),
  availableOn: z.string().min(1),
  notes: z.string().max(250).optional(),
});

function parseDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.parent]);
  if (auth.error || !auth.payload) return auth.error;

  const allowances = await prisma.allowanceSchedule.findMany({
    where: { parentId: auth.payload.userId },
    include: { child: true },
    orderBy: [{ availableOn: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    allowances: allowances.map((allowance) => ({
      id: allowance.id,
      title: allowance.title,
      amount: Number(allowance.amount),
      availableOn: allowance.availableOn.toISOString(),
      notes: allowance.notes,
      isActive: allowance.isActive,
      childId: allowance.childId,
      childName: allowance.child.nickname,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, [Role.parent]);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = allowanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid allowance payload" }, { status: 400 });
  }

  const child = await prisma.childProfile.findFirst({
    where: { id: parsed.data.childId, parentId: auth.payload.userId },
    select: { id: true, nickname: true },
  });

  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const availableOn = parseDate(parsed.data.availableOn);
  if (!availableOn) {
    return NextResponse.json({ error: "Invalid allowance date" }, { status: 400 });
  }

  const allowance = await prisma.allowanceSchedule.create({
    data: {
      childId: child.id,
      parentId: auth.payload.userId,
      title: parsed.data.title,
      amount: parsed.data.amount,
      availableOn,
      notes: parsed.data.notes?.trim() || undefined,
    },
  });

  return NextResponse.json(
    {
      message: "Allowance scheduled successfully",
      allowance: {
        id: allowance.id,
        title: allowance.title,
        amount: Number(allowance.amount),
        availableOn: allowance.availableOn.toISOString(),
        notes: allowance.notes,
        isActive: allowance.isActive,
        childName: child.nickname,
      },
    },
    { status: 201 }
  );
}