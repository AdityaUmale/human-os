import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const bodySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { phone } = bodySchema.parse(json);
    const e164 = `+91${phone}`;

    const user = await prisma.user.upsert({
      where: { phone: e164 },
      create: {
        phone: e164,
        phoneVerified: false,
        creditBalance: 12,
      },
      update: {},
      include: { birthDetails: true, humanOs: true },
    });

    await createSession(user.id);

    return NextResponse.json({
      userId: user.id,
      phone: user.phone,
      hasBirthDetails: Boolean(user.birthDetails),
      humanOsStatus: user.humanOs?.status ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
