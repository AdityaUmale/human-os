import { after } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isInteractionType } from "@/lib/decodes/catalog";
import { createInteractionDecode, generateDecode, listInteractions, listSubjectsForPicker } from "@/lib/decodes/service";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  kind: z.string().transform((value) => value.toUpperCase()),
  subjectAId: z.string().min(1),
  subjectBId: z.string().min(1),
});

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const picker = new URL(request.url).searchParams.get("picker") === "1";
  if (picker) return NextResponse.json({ subjects: await listSubjectsForPicker(user.id) });
  return NextResponse.json({ interactions: await listInteractions(user.id) });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = bodySchema.parse(await request.json());
    if (!isInteractionType(body.kind)) return NextResponse.json({ error: "Unknown Interaction type." }, { status: 400 });
    const created = await createInteractionDecode(user.id, body.kind, body.subjectAId, body.subjectBId);
    if (!created.reused) {
      after(async () => {
        try {
          await generateDecode(created.decodeId);
        } catch (error) {
          console.error("[interactions] generation failed", error);
        }
      });
    }
    return NextResponse.json({ ...created, status: created.reused ? "EXISTING" : "GENERATING" }, { status: created.reused ? 200 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create interaction.";
    const status = error instanceof Error && "code" in error && (error as { code?: string }).code === "SAME_SUBJECT" ? 400 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
