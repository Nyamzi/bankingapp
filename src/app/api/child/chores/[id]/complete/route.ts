import { NextRequest, NextResponse } from "next/server";
import { ChoreStatus, Role } from "@prisma/client";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = requireRole(request, [Role.child]);
  if (auth.error || !auth.payload) return auth.error;

  const child = await prisma.childProfile.findUnique({
    where: { childUserId: auth.payload.userId },
    select: { id: true },
  });

  if (!child) {
    return NextResponse.json({ error: "Child profile not found" }, { status: 404 });
  }

  const chore = await prisma.choreAssignment.findFirst({
    where: { id: context.params.id, childId: child.id },
    select: { id: true, status: true },
  });

  if (!chore) {
    return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  }

  if (chore.status === ChoreStatus.completed) {
    return NextResponse.json({ error: "Chore already completed" }, { status: 409 });
  }

  await prisma.choreAssignment.update({
    where: { id: chore.id },
    data: {
      status: ChoreStatus.completed,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ message: "Chore marked as completed" });
}