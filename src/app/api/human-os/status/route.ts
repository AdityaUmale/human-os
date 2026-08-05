import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const humanOs = await prisma.humanOsProfile.findUnique({
    where: { userId: user.id },
    select: {
      status: true,
      error: true,
      completedAt: true,
    },
  });

  return NextResponse.json({
    status: humanOs?.status ?? "NONE",
    error: humanOs?.error ?? null,
    completedAt: humanOs?.completedAt ?? null,
  });
}
