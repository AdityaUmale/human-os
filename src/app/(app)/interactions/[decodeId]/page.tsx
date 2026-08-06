import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DecodeInsightList } from "@/components/decodes/DecodeInsightList";
import { DECODE_CATALOG, isInteractionType } from "@/lib/decodes/catalog";
import { getOwnedDecode } from "@/lib/decodes/service";
import { requireUser } from "@/lib/session";

export default async function InteractionDecodePage({ params }: { params: Promise<{ decodeId: string }> }) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { decodeId } = await params;
  const decode = await getOwnedDecode(user.id, decodeId);
  if (!decode || !isInteractionType(decode.kind)) notFound();
  const catalog = DECODE_CATALOG[decode.kind];
  const safeInsights = decode.insights.map((insight) => ({ id: insight.id, insightKey: insight.insightKey, title: insight.title, description: insight.description, readTime: catalog.insights.find((meta) => meta.key === insight.insightKey)?.readTime, unlockCost: insight.unlockCost, unlockedAt: insight.unlockedAt }));
  return <><Link href="/interactions" className="inline-flex items-center gap-1.5 pt-[22px] text-[13px] text-[var(--ink-faint)]">← Interactions</Link><div className="pb-10 pt-10"><div className="font-mono-label mb-3 text-[10.5px] tracking-[0.14em] text-[var(--accent)] uppercase">{catalog.title}</div><h1 className="font-display mb-2 text-[34px] font-medium">{decode.primarySubject.displayName} & {decode.secondarySubject?.displayName}</h1><p className="font-display text-[15px] italic leading-[1.5] text-[var(--ink-faint)]">{catalog.subtitle}</p><hr className="my-6 border-0 border-t border-[var(--hairline-soft)]" /><div className="font-mono-label text-[11px] text-[var(--ink-faint)]">{catalog.insights.length} Insights • 2 credits each</div></div><DecodeInsightList decodeId={decode.id} insights={safeInsights} readerBase={`/interactions/${decode.id}`} status={decode.status} /></>;
}
