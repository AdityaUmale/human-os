import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { generateHumanOsForUser } from "@/lib/human-os/generate";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const birthSchema = z.object({
  fullName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeOfBirth: z.string().nullable().optional(),
  timeUnknown: z.boolean(),
  placeName: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timezone: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = birthSchema.parse(await request.json());

    await prisma.birthDetails.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fullName: body.fullName,
        dateOfBirth: body.dateOfBirth,
        timeOfBirth: body.timeUnknown ? null : body.timeOfBirth || null,
        timeUnknown: body.timeUnknown,
        placeName: body.placeName,
        lat: body.lat,
        lng: body.lng,
        timezone: body.timezone,
      },
      update: {
        fullName: body.fullName,
        dateOfBirth: body.dateOfBirth,
        timeOfBirth: body.timeUnknown ? null : body.timeOfBirth || null,
        timeUnknown: body.timeUnknown,
        placeName: body.placeName,
        lat: body.lat,
        lng: body.lng,
        timezone: body.timezone,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { name: body.fullName },
    });

    // Ensure generating status is visible immediately
    const existing = await prisma.humanOsProfile.findUnique({ where: { userId: user.id } });
    if (existing) {
      await prisma.humanOsProfile.update({
        where: { id: existing.id },
        data: { status: "GENERATING", error: null },
      });
    }

    // Background generation after the response is sent; keeps running on Vercel
    after(async () => {
      try {
        await generateHumanOsForUser(user.id);
      } catch (err) {
        console.error("Human OS generation failed", err);
      }
    });

    return NextResponse.json({ status: "GENERATING" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generate failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
