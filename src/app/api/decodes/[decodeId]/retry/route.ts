import { after } from "next/server";
import { NextResponse } from "next/server";
import { generateDecode, retryDecode } from "@/lib/decodes/service";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ decodeId: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { decodeId } = await context.params;
    await retryDecode(user.id, decodeId);
    after(async () => {
      try { await generateDecode(decodeId); } catch (error) { console.error("[decode/retry] failed", error); }
    });
    return NextResponse.json({ status: "GENERATING", decodeId }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not retry decode." }, { status: 400 });
  }
}
