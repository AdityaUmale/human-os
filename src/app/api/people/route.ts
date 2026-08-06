import { after } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createPersonDecode, generateDecode, listPeople, type BirthDetailsInput } from "@/lib/decodes/service";
import { isPeopleDecoderType } from "@/lib/decodes/catalog";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const birthSchema = z.object({
  fullName: z.string().trim().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeOfBirth: z.string().nullable().optional(),
  timeUnknown: z.boolean(),
  placeName: z.string().trim().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timezone: z.string().min(1),
});

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const people = await listPeople(user.id);
  return NextResponse.json({ people });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const kind = typeof body.kind === "string" ? body.kind.toUpperCase() : "";
    if (!isPeopleDecoderType(kind)) return NextResponse.json({ error: "Unknown People decoder." }, { status: 400 });
    const birth = birthSchema.parse(body.birth) as BirthDetailsInput;
    const created = await createPersonDecode(user.id, kind, birth);
    if (!created.reused) {
      after(async () => {
        try {
          await generateDecode(created.decodeId);
        } catch (error) {
          console.error("[people] generation failed", error);
        }
      });
    }
    return NextResponse.json({ ...created, status: created.reused ? "EXISTING" : "GENERATING" }, { status: created.reused ? 200 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create person.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
