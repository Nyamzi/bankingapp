import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const quizSchema = z.object({
  title: z.string().min(3),
  isPublished: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.admin]);
  if (auth.error || !auth.payload) return auth.error;
  const quizzes = await prisma.quiz.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ quizzes });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, [Role.admin]);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = quizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quiz payload" }, { status: 400 });
  }

  const quiz = await prisma.quiz.create({
    data: {
      title: parsed.data.title,
      isPublished: parsed.data.isPublished ?? false,
      createdById: auth.payload.userId,
    },
  });

  return NextResponse.json({ quiz }, { status: 201 });
}