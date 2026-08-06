"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function DecodeGenerationPoll({ decodeId, destination }: { decodeId: string; destination: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await fetch(`/api/decodes/${decodeId}/status`, { cache: "no-store" });
        const body = (await response.json()) as { status?: string; error?: string };
        if (cancelled) return;
        if (body.status === "COMPLETED") return router.replace(destination);
        if (body.status === "FAILED") return setError(body.error || "Decode generation failed.");
        timer = setTimeout(poll, 2000);
      } catch {
        if (!cancelled) timer = setTimeout(poll, 3000);
      }
    }
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [decodeId, destination, router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="relative mb-9 h-[72px] w-[72px]">
        <div className="absolute inset-0 rounded-full border border-[var(--hairline)]" />
        <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-[var(--accent)] border-r-[var(--accent)]" style={{ animationDuration: "1.6s" }} />
        <div className="absolute inset-7 animate-pulse rounded-full bg-[var(--accent)] opacity-60" />
      </div>
      <h1 className="font-display mb-4 text-[25px] font-medium">Rendering your decode</h1>
      {error ? (
        <div className="max-w-[300px] space-y-4 text-[13.5px] leading-relaxed text-red-300">
          <p>{error}</p>
          <button type="button" className="text-[var(--accent)] underline" onClick={() => router.replace(destination)}>Back to decode</button>
        </div>
      ) : (
        <p className="text-[13.5px] text-[var(--ink-faint)]">Connecting your Human OS to this relationship lens…</p>
      )}
    </div>
  );
}
