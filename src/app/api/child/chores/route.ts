import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const completeChoreSchema = z.object({
  choreId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.child]);
  if (auth.error || !auth.payload) return auth.error;

  const child = await prisma.childProfile.findUnique({
    where: { childUserId: auth.payload.userId },
    include: { chores: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] } },
  });

  if (!child) {
    return NextResponse.json({ error: "Child profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    chores: child.chores.map((chore) => ({
      id: chore.id,
      title: chore.title,
      description: chore.description,
      dueDate: chore.dueDate?.toISOString() ?? null,
      status: chore.status,
      completedAt: chore.completedAt?.toISOString() ?? null,
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const auth = requireRole(request, [Role.child]);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = completeChoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chore payload" }, { status: 400 });
  }

  const child = await prisma.childProfile.findUnique({
    where: { childUserId: auth.payload.userId },
    select: { id: true },
  });

  if (!child) {
    return NextResponse.json({ error: "Child profile not found" }, { status: 404 });
  }

  const chore = await prisma.choreAssignment.findFirst({
    where: { id: parsed.data.choreId, childId: child.id },
    select: { id: true, status: true },
  });

  if (!chore) {
    return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  }

  if (chore.status === "completed") {
    return NextResponse.json({ message: "Chore already completed" });
  }

  await prisma.choreAssignment.update({
    where: { id: chore.id },
    data: { status: "completed", completedAt: new Date() },
  });

  return NextResponse.json({ message: "Chore marked as completed" });
}