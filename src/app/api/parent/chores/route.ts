import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const choreSchema = z.object({
  childId: z.string().min(1),
  title: z.string().min(2).max(120),
  description: z.string().max(250).optional(),
  dueDate: z.string().optional(),
});

function parseOptionalDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.parent]);
  if (auth.error || !auth.payload) return auth.error;

  const chores = await prisma.choreAssignment.findMany({
    where: { parentId: auth.payload.userId },
    include: { child: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    chores: chores.map((chore) => ({
      id: chore.id,
      title: chore.title,
      description: chore.description,
      dueDate: chore.dueDate?.toISOString() ?? null,
      status: chore.status,
      completedAt: chore.completedAt?.toISOString() ?? null,
      childId: chore.childId,
      childName: chore.child.nickname,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, [Role.parent]);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = choreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chore payload" }, { status: 400 });
  }

  const child = await prisma.childProfile.findFirst({
    where: { id: parsed.data.childId, parentId: auth.payload.userId },
    select: { id: true, nickname: true },
  });

  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const dueDate = parseOptionalDate(parsed.data.dueDate);
  if (parsed.data.dueDate && dueDate === undefined) {
    return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
  }

  const chore = await prisma.choreAssignment.create({
    data: {
      childId: child.id,
      parentId: auth.payload.userId,
      title: parsed.data.title,
      description: parsed.data.description?.trim() || undefined,
      dueDate: dueDate ?? undefined,
    },
  });

  return NextResponse.json(
    {
      message: "Chore assigned successfully",
      chore: {
        id: chore.id,
        title: chore.title,
        description: chore.description,
        dueDate: chore.dueDate?.toISOString() ?? null,
        status: chore.status,
        childName: child.nickname,
      },
    },
    { status: 201 }
  );
}