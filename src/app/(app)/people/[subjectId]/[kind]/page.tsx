import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DecodeInsightList } from "@/components/decodes/DecodeInsightList";
import { DECODE_CATALOG, isPeopleDecoderType } from "@/lib/decodes/catalog";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PersonDecodePage({ params }: { params: Promise<{ subjectId: string; kind: string }> }) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { subjectId, kind: rawKind } = await params;
  const kind = rawKind.toUpperCase();
  if (!isPeopleDecoderType(kind)) notFound();
  const actual = await prisma.decode.findFirst({ where: { ownerUserId: user.id, primarySubjectId: subjectId, kind }, include: { primarySubject: true, insights: { orderBy: { ordinal: "asc" } } } });
  if (!actual) notFound();
  const catalog = DECODE_CATALOG[kind];
  const safeInsights = actual.insights.map((insight) => ({ id: insight.id, insightKey: insight.insightKey, title: insight.title, description: insight.description, readTime: catalog.insights.find((meta) => meta.key === insight.insightKey)?.readTime, unlockCost: insight.unlockCost, unlockedAt: insight.unlockedAt }));
  return <><Link href={`/people/${subjectId}`} className="inline-flex items-center gap-1.5 pt-[22px] text-[13px] text-[var(--ink-faint)]">← {actual.primarySubject.displayName}</Link><div className="pb-10 pt-10"><div className="font-mono-label mb-3 text-[10.5px] tracking-[0.14em] text-[var(--accent)] uppercase">{catalog.title}</div><h1 className="font-display mb-2 text-[34px] font-medium">{actual.primarySubject.displayName}</h1><p className="font-display text-[15px] italic leading-[1.5] text-[var(--ink-faint)]">{catalog.subtitle}</p><hr className="my-6 border-0 border-t border-[var(--hairline-soft)]" /><div className="font-mono-label text-[11px] text-[var(--ink-faint)]">{catalog.insights.length} Insights • 2 credits each</div></div><DecodeInsightList decodeId={actual.id} insights={safeInsights} readerBase={`/people/${subjectId}/${kind.toLowerCase()}`} status={actual.status} /></>;
}
