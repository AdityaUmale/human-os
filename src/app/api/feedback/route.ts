import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const schema = z.object({
  domain: z.string(),
  insightKey: z.string(),
  rating: z.enum(["Completely", "Mostly", "Somewhat", "Not really"]),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    await prisma.insightFeedback.create({
      data: {
        userId: user.id,
        domain: body.domain,
        insightKey: body.insightKey,
        rating: body.rating,
        humanOsVersion: "v1.0",
        rendererVersion: "v1.0",
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feedback failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
