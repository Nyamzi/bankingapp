import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const lessonSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  isPublished: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = requireRole(request, [Role.admin]);
  if (auth.error || !auth.payload) return auth.error;

  const lessons = await prisma.lesson.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ lessons });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, [Role.admin]);
  if (auth.error || !auth.payload) return auth.error;

  const body = await request.json();
  const parsed = lessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lesson payload" }, { status: 400 });
  }

  const lesson = await prisma.lesson.create({
    data: {
      ...parsed.data,
      isPublished: parsed.data.isPublished ?? false,
      createdById: auth.payload.userId,
    },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}