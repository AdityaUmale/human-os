"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Insight = {
  id: string;
  insightKey: string;
  title: string;
  description: string;
  readTime?: string;
  unlockCost: number;
  unlockedAt: string | Date | null;
};

export function DecodeInsightList({
  decodeId,
  insights,
  readerBase,
  status,
}: {
  decodeId: string;
  insights: Insight[];
  readerBase: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function unlock(insight: Insight) {
    setBusy(insight.id);
    setError(null);
    try {
      const response = await fetch(`/api/decodes/${decodeId}/insights/${insight.id}/unlock`, { method: "POST" });
      const body = (await response.json()) as { error?: string; code?: string };
      if (!response.ok) throw new Error(body.error || "Could not unlock this insight.");
      router.push(`${readerBase}/${insight.insightKey}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not unlock this insight.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function retry() {
    setBusy("retry");
    const response = await fetch(`/api/decodes/${decodeId}/retry`, { method: "POST" });
    if (response.ok) router.push(`/decodes/${decodeId}/generating?return=${encodeURIComponent(readerBase)}`);
    else setError("Could not restart this decode.");
    setBusy(null);
  }

  if (status !== "COMPLETED") {
    return (
      <div className="rounded-[14px] border border-[var(--hairline)] bg-[var(--bg-raised)] p-5 text-[13.5px] leading-relaxed text-[var(--ink-faint)]">
        {status === "FAILED" ? <><p>This decode could not be rendered.</p><button type="button" disabled={busy === "retry"} onClick={retry} className="mt-3 text-[var(--accent)] disabled:opacity-50">{busy === "retry" ? "Restarting…" : "Try again →"}</button></> : "Your decode is still being rendered…"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <div className="rounded-[10px] border border-red-900/50 bg-red-950/20 p-3 text-[13px] text-red-300">{error}</div>}
      {insights.map((insight, index) => {
        const ready = Boolean(insight.unlockedAt);
        return (
          <div key={insight.id} className="rounded-[14px] border border-[var(--hairline)] bg-[var(--bg-raised)] px-5 pt-5 pb-[18px]">
            <div className="font-mono-label mb-2 text-[10px] tracking-[0.14em] text-[var(--accent)] uppercase">Insight {index + 1}</div>
            <div className="font-display mb-1.5 text-[19px] font-medium text-[var(--ink)]">{insight.title}</div>
            <div className="mb-3.5 text-[13px] leading-[1.55] text-[var(--ink-faint)]">{insight.description}</div>
            <div className="mb-3 font-mono-label text-[11px] text-[var(--ink-faint)]">{insight.readTime || `~${index === 1 ? "3" : "2"} min read`}</div>
            {ready ? (
              <Link href={`${readerBase}/${insight.insightKey}`} className="text-[12.5px] font-semibold text-[var(--accent)]">Read →</Link>
            ) : (
              <button type="button" disabled={busy === insight.id} onClick={() => unlock(insight)} className="text-[12.5px] font-semibold text-[var(--accent-dim)] disabled:opacity-50">
                {busy === insight.id ? "Unlocking…" : `Unlock • ${insight.unlockCost} Credits →`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
