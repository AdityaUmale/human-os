import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DecodePayload } from "@/components/decodes/DecodePayload";
import { DecodeInsightList } from "@/components/decodes/DecodeInsightList";
import { DECODE_CATALOG, isPeopleDecoderType } from "@/lib/decodes/catalog";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PersonInsightPage({ params }: { params: Promise<{ subjectId: string; kind: string; insight: string }> }) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { subjectId, kind: rawKind, insight } = await params;
  const kind = rawKind.toUpperCase();
  if (!isPeopleDecoderType(kind)) notFound();
  const decode = await prisma.decode.findFirst({ where: { ownerUserId: user.id, primarySubjectId: subjectId, kind }, include: { primarySubject: true, insights: { orderBy: { ordinal: "asc" } } } });
  if (!decode) notFound();
  const target = decode.insights.find((candidate) => candidate.insightKey === insight);
  if (!target) notFound();
  const catalog = DECODE_CATALOG[kind];
  return <><Link href={`/people/${subjectId}/${kind.toLowerCase()}`} className="inline-flex items-center gap-1.5 pt-[22px] text-[13px] text-[var(--ink-faint)]">← {catalog.title}</Link><div className="pb-8 pt-10"><div className="font-mono-label mb-3 text-[10.5px] tracking-[0.14em] text-[var(--accent)] uppercase">Insight {target.ordinal + 1} · {catalog.title}</div><h1 className="font-display mb-3 text-[34px] font-medium">{target.title}</h1><p className="font-display text-[15px] italic leading-[1.5] text-[var(--ink-faint)]">{target.description}</p></div>{target.unlockedAt ? <DecodePayload payload={target.payload as Record<string, unknown>} /> : <DecodeInsightList decodeId={decode.id} insights={[{ id: target.id, insightKey: target.insightKey, title: target.title, description: target.description, readTime: catalog.insights.find((meta) => meta.key === target.insightKey)?.readTime, unlockCost: target.unlockCost, unlockedAt: null }]} readerBase={`/people/${subjectId}/${kind.toLowerCase()}`} status={decode.status} />}</>;
}
