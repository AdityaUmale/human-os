import { after } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createLensDecode, generateDecode } from "@/lib/decodes/service";
import { isPeopleDecoderType } from "@/lib/decodes/catalog";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ kind: z.string().transform((value) => value.toUpperCase()) });

export async function POST(request: Request, context: { params: Promise<{ subjectId: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { subjectId } = await context.params;
    const body = bodySchema.parse(await request.json());
    if (!isPeopleDecoderType(body.kind)) return NextResponse.json({ error: "Unknown People decoder." }, { status: 400 });
    const created = await createLensDecode(user.id, subjectId, body.kind);
    if (!created.reused) {
      after(async () => {
        try {
          await generateDecode(created.decodeId);
        } catch (error) {
          console.error("[people/lens] generation failed", error);
        }
      });
    }
    return NextResponse.json({ ...created, status: created.reused ? "EXISTING" : "GENERATING" }, { status: created.reused ? 200 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add decoder lens.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
