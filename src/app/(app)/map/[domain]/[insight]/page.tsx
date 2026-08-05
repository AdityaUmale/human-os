import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InsightFeedback } from "@/components/insights/InsightFeedback";
import { getInsight, isDomainKey } from "@/lib/catalog/domains";
import { viewFromInsight } from "@/lib/human-os/insight-view";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function DomainInsightPage({
  params,
}: {
  params: Promise<{ domain: string; insight: string }>;
}) {
  const { domain: domainKey, insight: insightKey } = await params;
  if (!isDomainKey(domainKey)) notFound();

  const found = getInsight(domainKey, insightKey);
  if (!found) notFound();
  const { domain, insight: meta } = found;

  const user = await requireUser();
  if (!user) redirect("/login");
  if (!user.humanOs || user.humanOs.status !== "COMPLETED") {
    redirect("/onboarding/generating");
  }

  const render = await prisma.insightRender.findFirst({
    where: {
      userId: user.id,
      domain: domainKey,
      insightKey,
      humanOsId: user.humanOs.id,
    },
  });
  if (!render) notFound();

  const payload =
    render.payload && typeof render.payload === "object"
      ? (render.payload as Record<string, unknown>)
      : {};
  const view = viewFromInsight(payload, meta);

  const index = domain.insights.findIndex((i) => i.key === insightKey);
  const prev = index > 0 ? domain.insights[index - 1] : null;
  const next =
    index < domain.insights.length - 1 ? domain.insights[index + 1] : null;

  return (
    <div className="px-1 pb-10">
      <Link
        href={`/map/${domainKey}`}
        className="inline-flex items-center gap-1.5 pt-[22px] text-[13px] text-[var(--ink-faint)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {domain.title}
      </Link>

      <h1 className="font-display mt-[38px] mb-3.5 text-[33px] font-medium leading-[1.15] tracking-[-0.01em] text-[var(--ink)]">
        {meta.title}
      </h1>
      <div className="font-display mb-11 text-base font-normal italic leading-[1.5] text-[var(--ink-faint)]">
        {meta.anchorQuestion}
      </div>

      {view.mainNarrative && (
        <div className="text-base leading-[1.8] text-[var(--read)]">
          <p className="mb-[22px]">{view.mainNarrative}</p>
        </div>
      )}

      {meta.layout === "principles" && view.principles.length > 0 && (
        <Section title="Core Principles">
          <div className="flex flex-col gap-5">
            {view.principles.map((p) => (
              <div key={p.title}>
                <div className="mb-1 font-semibold text-[var(--ink)]">{p.title}</div>
                <div className="text-[14.5px] leading-[1.55] text-[var(--ink-faint)]">{p.desc}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {meta.layout === "tension" && (
        <div className="mt-1 space-y-4">
          {view.sideA && (
            <div>
              <div className="font-mono-label mb-1.5 text-[10px] tracking-[0.12em] text-[var(--accent)] uppercase">
                Side A
              </div>
              <div className="font-display mb-1.5 text-[17px] font-medium text-[var(--ink)]">
                {view.sideA.title}
              </div>
              <div className="text-[13.5px] leading-[1.55] text-[var(--ink-faint)]">
                {view.sideA.desc}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-[var(--hairline-soft)]" />
            <span className="font-mono-label text-[13px] text-[var(--accent-dim)]">×</span>
            <div className="h-px flex-1 bg-[var(--hairline-soft)]" />
          </div>
          {view.sideB && (
            <div>
              <div className="font-mono-label mb-1.5 text-[10px] tracking-[0.12em] text-[var(--accent)] uppercase">
                Side B
              </div>
              <div className="font-display mb-1.5 text-[17px] font-medium text-[var(--ink)]">
                {view.sideB.title}
              </div>
              <div className="text-[13.5px] leading-[1.55] text-[var(--ink-faint)]">
                {view.sideB.desc}
              </div>
            </div>
          )}
        </div>
      )}

      {view.bulletGroups.map((group) => (
        <Section key={group.title} title={group.title}>
          <Bullets items={group.items} />
        </Section>
      ))}

      {view.extraParagraphs.map((p) => (
        <Section key={p.title} title={p.title}>
          <p className="text-[15px] leading-[1.7] text-[var(--ink-dim)]">{p.text}</p>
        </Section>
      ))}

      {view.whyBothExist && (
        <Section title="Why Both Exist">
          <p className="text-[15px] leading-[1.7] text-[var(--ink-dim)]">{view.whyBothExist}</p>
        </Section>
      )}

      {view.whyThisMatters && (
        <Section title="Why This Matters">
          <p className="text-[15px] leading-[1.7] text-[var(--ink-dim)]">{view.whyThisMatters}</p>
        </Section>
      )}

      <hr className="my-14 border-0 border-t border-[var(--hairline-soft)]" />
      <InsightFeedback domain={domainKey} insightKey={insightKey} />
      <hr className="my-14 border-0 border-t border-[var(--hairline-soft)]" />

      <div className="text-center">
        <div className="font-display mb-3 text-xl font-medium text-[var(--ink)]">Go Deeper</div>
        <p className="mx-auto mb-6 max-w-[300px] text-[13.5px] leading-[1.6] text-[var(--ink-faint)]">
          Conversations ship in a later release.
        </p>
      </div>

      <div className="mt-11 flex items-center justify-between border-t border-[var(--hairline-soft)] pt-5">
        {prev ? (
          <Link
            href={`/map/${domainKey}/${prev.key}`}
            className="flex items-center gap-1.5 text-[12.5px] text-[var(--ink-faint)]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/map/${domainKey}/${next.key}`}
            className="flex items-center gap-1.5 text-[12.5px] text-[var(--ink-faint)]"
          >
            {next.title}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display mt-[52px] mb-5 text-[19px] font-medium text-[var(--ink)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-[14.5px] text-[var(--ink-faint)]">—</p>;
  }
  return (
    <div className="flex flex-col gap-3.5">
      {items.map((item) => (
        <div key={item} className="text-[14.5px] leading-[1.6] text-[var(--ink-dim)]">
          {item}
        </div>
      ))}
    </div>
  );
}
