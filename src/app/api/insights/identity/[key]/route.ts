import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { IDENTITY_INSIGHTS, isIdentityInsightKey } from "@/lib/catalog/domains";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await context.params;
  if (!isIdentityInsightKey(key)) {
    return NextResponse.json({ error: "Unknown insight" }, { status: 404 });
  }

  const meta = IDENTITY_INSIGHTS.find((i) => i.key === key)!;
  const humanOs = await prisma.humanOsProfile.findUnique({
    where: { userId: user.id },
  });

  if (!humanOs || humanOs.status !== "COMPLETED") {
    return NextResponse.json({ error: "Human OS not ready" }, { status: 409 });
  }

  const render = await prisma.insightRender.findFirst({
    where: {
      userId: user.id,
      domain: "identity",
      insightKey: key,
      humanOsId: humanOs.id,
    },
  });

  if (!render) {
    return NextResponse.json({ error: "Insight not generated" }, { status: 404 });
  }

  const index = IDENTITY_INSIGHTS.findIndex((i) => i.key === key);
  const prev = index > 0 ? IDENTITY_INSIGHTS[index - 1] : null;
  const next = index < IDENTITY_INSIGHTS.length - 1 ? IDENTITY_INSIGHTS[index + 1] : null;

  return NextResponse.json({
    key,
    title: meta.title,
    layout: meta.layout,
    anchorQuestion: meta.anchorQuestion,
    payload: render.payload,
    nav: {
      prev: prev ? { key: prev.key, title: prev.title } : null,
      next: next ? { key: next.key, title: next.title } : null,
    },
  });
}
