import { NextResponse } from "next/server";
import { getDecodeCatalog } from "@/lib/decodes/catalog";
import { getOwnedDecode } from "@/lib/decodes/service";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ decodeId: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { decodeId } = await context.params;
  const decode = await getOwnedDecode(user.id, decodeId);
  if (!decode) return NextResponse.json({ error: "Decode not found." }, { status: 404 });
  const catalog = getDecodeCatalog(decode.kind as Parameters<typeof getDecodeCatalog>[0]);
  return NextResponse.json({
    id: decode.id,
    kind: decode.kind,
    status: decode.status,
    error: decode.error,
    title: catalog.title,
    insightCount: catalog.insights.length,
    ready: decode.status === "COMPLETED",
  });
}
