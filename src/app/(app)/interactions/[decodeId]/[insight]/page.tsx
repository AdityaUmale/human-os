import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DecodePayload } from "@/components/decodes/DecodePayload";
import { DecodeInsightList } from "@/components/decodes/DecodeInsightList";
import { getOwnedDecode } from "@/lib/decodes/service";
import { requireUser } from "@/lib/session";
import { DECODE_CATALOG, isInteractionType } from "@/lib/decodes/catalog";

export default async function InteractionInsightPage({ params }: { params: Promise<{ decodeId: string; insight: string }> }) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { decodeId, insight } = await params;
  const decode = await getOwnedDecode(user.id, decodeId);
  if (!decode || !isInteractionType(decode.kind)) notFound();
  const target = decode.insights.find((candidate) => candidate.insightKey === insight);
  if (!target) notFound();
  const catalog = DECODE_CATALOG[decode.kind];
  return <><Link href={`/interactions/${decode.id}`} className="inline-flex items-center gap-1.5 pt-[22px] text-[13px] text-[var(--ink-faint)]">← {catalog.title}</Link><div className="pb-8 pt-10"><div className="font-mono-label mb-3 text-[10.5px] tracking-[0.14em] text-[var(--accent)] uppercase">Insight {target.ordinal + 1} · {catalog.title}</div><h1 className="font-display mb-3 text-[34px] font-medium">{target.title}</h1><p className="font-display text-[15px] italic leading-[1.5] text-[var(--ink-faint)]">{target.description}</p></div>{target.unlockedAt ? <DecodePayload payload={target.payload as Record<string, unknown>} /> : <DecodeInsightList decodeId={decode.id} insights={[{ id: target.id, insightKey: target.insightKey, title: target.title, description: target.description, readTime: catalog.insights.find((meta) => meta.key === target.insightKey)?.readTime, unlockCost: target.unlockCost, unlockedAt: null }]} readerBase={`/interactions/${decode.id}`} status={decode.status} />}</>;
}
