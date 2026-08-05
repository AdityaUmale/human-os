import { NextResponse } from "next/server";
import { getDomain, isDomainKey } from "@/lib/catalog/domains";
import { isInsightPayloadUsable } from "@/lib/human-os/schemas";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ domain: string }> },
) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domain: domainKey } = await context.params;
    if (!isDomainKey(domainKey)) {
      return NextResponse.json({ error: "Unknown domain" }, { status: 404 });
    }

    const domain = getDomain(domainKey)!;
    const humanOs = await prisma.humanOsProfile.findUnique({
      where: { userId: user.id },
    });

    if (!humanOs || humanOs.status !== "COMPLETED") {
      return NextResponse.json({
        status: "NOT_READY",
        ready: 0,
        total: domain.insights.length,
        keys: [],
      });
    }

    const renders = await prisma.insightRender.findMany({
      where: {
        userId: user.id,
        domain: domainKey,
        humanOsId: humanOs.id,
      },
    });

    const usable = renders.filter((r) => {
      const payload =
        r.payload && typeof r.payload === "object"
          ? (r.payload as Record<string, unknown>)
          : {};
      return isInsightPayloadUsable(payload);
    });

    const total = domain.insights.length;
    const ready = usable.length;
    const status =
      ready === 0
        ? renders.length === 0
          ? "EMPTY"
          : "BROKEN"
        : ready < total
          ? "PARTIAL"
          : "READY";

    const latestUpdatedAt = renders.reduce<string | null>((max, r) => {
      const t = r.updatedAt?.toISOString?.() ?? null;
      if (!t) return max;
      if (!max || t > max) return t;
      return max;
    }, null);

    return NextResponse.json({
      status,
      ready,
      total,
      keys: usable.map((r) => r.insightKey),
      allKeys: renders.map((r) => r.insightKey),
      latestUpdatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
