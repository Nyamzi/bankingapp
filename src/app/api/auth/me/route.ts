import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/guards";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error || !auth.payload) return auth.error;
  return NextResponse.json({ user: auth.payload });
}