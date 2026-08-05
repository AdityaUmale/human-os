"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readJsonOrThrow } from "@/lib/safe-json";

type StatusPayload = {
  status?: string;
  ready?: number;
  total?: number;
  keys?: string[];
  latestUpdatedAt?: string | null;
  error?: string;
};

export function RerenderDomainButton({ domain }: { domain: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function pollUntilReady(startedAt: number, timeoutMs = 180_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 2500));
      const res = await fetch(`/api/insights/${domain}/status`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = await readJsonOrThrow<StatusPayload>(res);

      if (!res.ok) {
        throw new Error(data.error || `Status failed (${res.status})`);
      }

      setStatus(`Rendered ${data.ready ?? 0}/${data.total ?? "?"} insights…`);

      const updatedMs = data.latestUpdatedAt
        ? new Date(data.latestUpdatedAt).getTime()
        : 0;
      // Require fresh write after we started, and all insights usable
      if (
        data.status === "READY" &&
        updatedMs >= startedAt - 1000 &&
        (data.ready ?? 0) === (data.total ?? -1)
      ) {
        return data;
      }
    }

    const res = await fetch(`/api/insights/${domain}/status`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    return readJsonOrThrow<StatusPayload>(res);
  }

  async function rerender() {
    setLoading(true);
    setError(null);
    const startedAt = Date.now();
    setStatus("Starting re-render…");
    try {
      const res = await fetch(`/api/insights/${domain}/rerender`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      const data = await readJsonOrThrow<{
        error?: string;
        mode?: string;
        status?: string;
        renderedKeys?: string[];
      }>(res);

      if (!res.ok) {
        throw new Error(data.error || `Rerender failed (${res.status})`);
      }

      if (data.mode === "async" || data.status === "STARTED") {
        setStatus("Running LLM… keep this page open (1–2 min).");
        const final = await pollUntilReady(startedAt);
        if ((final.ready ?? 0) === 0 || final.status !== "READY") {
          throw new Error(
            final.status === "BROKEN" || final.status === "PARTIAL"
              ? `Re-render finished with ${final.ready}/${final.total} usable insights. Check Langfuse prompt / server logs.`
              : "Re-render timed out or produced no insights. Check server logs.",
          );
        }
        setStatus(`Done — ${final.ready}/${final.total} insights ready.`);
      } else {
        setStatus(
          data.renderedKeys?.length
            ? `Rendered: ${data.renderedKeys.join(", ")}`
            : "Done.",
        );
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rerender failed");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={rerender}
        disabled={loading}
        className="rounded-[10px] bg-[var(--ink)] px-4 py-2.5 text-[13px] font-semibold text-[var(--bg)] disabled:opacity-40"
      >
        {loading ? "Re-rendering… (wait)" : `Re-render ${domain} insights`}
      </button>
      {status && !error && (
        <p className="mt-2 text-[12px] text-[var(--ink-dim)]">{status}</p>
      )}
      {error && <p className="mt-2 text-[12px] text-red-400">{error}</p>}
    </div>
  );
}
