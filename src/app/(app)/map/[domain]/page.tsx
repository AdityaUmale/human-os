import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreditsPill } from "@/components/CreditsPill";
import { RerenderDomainButton } from "@/components/RerenderDomainButton";
import { getDomain, isDomainKey } from "@/lib/catalog/domains";
import { isInsightPayloadUsable } from "@/lib/human-os/schemas";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function DomainTocPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: domainKey } = await params;
  if (!isDomainKey(domainKey)) notFound();

  const domain = getDomain(domainKey)!;
  if (!domain.available) notFound();

  const user = await requireUser();
  if (!user) redirect("/login");
  if (!user.humanOs || user.humanOs.status !== "COMPLETED") {
    redirect("/onboarding/generating");
  }

  const renders = await prisma.insightRender.findMany({
    where: {
      userId: user.id,
      domain: domainKey,
      humanOsId: user.humanOs.id,
    },
  });
  const byKey = Object.fromEntries(renders.map((r) => [r.insightKey, r]));
  const anyBroken = domain.insights.some((i) => {
    const row = byKey[i.key];
    if (!row) return true;
    const payload =
      row.payload && typeof row.payload === "object"
        ? (row.payload as Record<string, unknown>)
        : {};
    return !isInsightPayloadUsable(payload);
  });
  const noneRendered = domain.insights.every((i) => !byKey[i.key]);

  return (
    <div className="px-0.5">
      <div className="flex items-center justify-between pt-[22px]">
        <Link href="/" className="flex items-center gap-1.5 text-[13px] text-[var(--ink-faint)]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Your Map
        </Link>
        <CreditsPill balance={user.creditBalance} />
      </div>

      {(anyBroken || noneRendered) && (
        <div className="mt-6 rounded-[12px] border border-[var(--hairline)] bg-[var(--bg-raised)] p-4">
          <p className="mb-3 text-[13px] leading-relaxed text-[var(--ink-dim)]">
            {noneRendered
              ? `${domain.title} insights have not been generated yet. Render them from your existing Human OS.`
              : `Some ${domain.title} insights need re-rendering.`}
          </p>
          <RerenderDomainButton domain={domainKey} />
        </div>
      )}

      <div className="pb-[46px] pt-10">
        <div className="font-mono-label mb-3.5 text-[10.5px] tracking-[0.14em] text-[var(--accent)] uppercase">
          {domain.title}
        </div>
        <h1 className="font-display mb-2.5 text-[34px] font-medium tracking-[-0.01em] text-[var(--ink)]">
          {domain.title}
        </h1>
        <p className="font-display mb-6 max-w-[300px] text-[15px] font-normal italic leading-[1.5] text-[var(--ink-faint)]">
          {domain.subtitle}
        </p>
        <hr className="mb-5 border-0 border-t border-[var(--hairline-soft)]" />
        <div className="font-mono-label mb-1.5 text-[11px] tracking-[0.02em] text-[var(--ink-faint)]">
          {domain.insights.length} Insights • UI credits only
        </div>
        <div className="text-[13.5px] font-medium text-[var(--ink-dim)]">
          You have {user.creditBalance} credits available.
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {domain.insights.map((t) => {
          const row = byKey[t.key];
          const payload =
            row?.payload && typeof row.payload === "object"
              ? (row.payload as Record<string, unknown>)
              : {};
          const ready = Boolean(row && isInsightPayloadUsable(payload));
          return (
            <Link
              key={t.key}
              href={row ? `/map/${domainKey}/${t.key}` : `#`}
              className="block w-full rounded-[14px] border border-[var(--hairline)] bg-[var(--bg-raised)] px-5 pt-5 pb-[18px] text-left transition-colors hover:border-[#38383e]"
            >
              <div className="font-display mb-1.5 text-lg font-medium text-[var(--ink)]">
                {t.title}
              </div>
              <div className="mb-3.5 max-w-[92%] text-[13px] leading-[1.55] text-[var(--ink-faint)]">
                {t.desc}
              </div>
              <div
                className={`text-[12.5px] font-semibold ${
                  ready ? "text-[var(--accent)]" : "text-[var(--accent-dim)]"
                }`}
              >
                {ready ? "Read →" : row ? "Needs re-render →" : "Not generated →"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
