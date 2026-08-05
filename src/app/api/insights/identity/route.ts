import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { IDENTITY_INSIGHTS } from "@/lib/catalog/domains";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const humanOs = await prisma.humanOsProfile.findUnique({
    where: { userId: user.id },
  });

  if (!humanOs || humanOs.status !== "COMPLETED") {
    return NextResponse.json({ error: "Human OS not ready" }, { status: 409 });
  }

  const renders = await prisma.insightRender.findMany({
    where: { userId: user.id, domain: "identity", humanOsId: humanOs.id },
  });

  const byKey = Object.fromEntries(renders.map((r) => [r.insightKey, r]));

  const topics = IDENTITY_INSIGHTS.map((insight) => ({
    key: insight.key,
    title: insight.title,
    desc: insight.desc,
    layout: insight.layout,
    available: Boolean(byKey[insight.key]),
  }));

  return NextResponse.json({
    domain: "identity",
    creditBalance: user.creditBalance,
    topics,
  });
}
