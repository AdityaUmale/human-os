import { NextResponse } from "next/server";
import { getOwnedDecode, unlockDecodeInsight, DecodeServiceError } from "@/lib/decodes/service";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ decodeId: string; insightId: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { decodeId, insightId } = await context.params;
    const decode = await getOwnedDecode(user.id, decodeId);
    if (!decode || !decode.insights.some((insight) => insight.id === insightId)) {
      return NextResponse.json({ error: "Insight not found." }, { status: 404 });
    }
    const result = await unlockDecodeInsight(user.id, insightId);
    return NextResponse.json({ unlocked: true, balance: result.balance, payload: result.insight.payload });
  } catch (error) {
    if (error instanceof DecodeServiceError && error.code === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ code: error.code, error: error.message }, { status: 402 });
    }
    const message = error instanceof Error ? error.message : "Could not unlock insight.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
