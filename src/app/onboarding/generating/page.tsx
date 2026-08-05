"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readJsonSafe } from "@/lib/safe-json";

const MESSAGES = [
  "Mapping your innate design...",
  "Understanding your current season...",
  "Connecting the patterns...",
  "Building your Human OS...",
  "Rendering Identity insights...",
  "Rendering Mind & Relationships...",
  "Rendering Work, Growth & Season...",
];

export default function GeneratingPage() {
  const router = useRouter();
  const [msgIndex, setMsgIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rot = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 2500);
    return () => clearInterval(rot);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch("/api/human-os/status", { cache: "no-store" });
        const { data, ok } = await readJsonSafe<{ status?: string; error?: string }>(res);
        if (cancelled) return;

        if (!ok || !data) {
          timer = setTimeout(poll, 3000);
          return;
        }

        if (data.status === "COMPLETED") {
          router.replace("/");
          return;
        }
        if (data.status === "FAILED") {
          setError(data.error || "Generation failed. Please try again.");
          return;
        }
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
  }, [router]);

  return (
    <div className="page-shell relative flex min-h-screen flex-col items-center justify-center px-7 py-12">
      <div className="absolute top-12 left-0 right-0 text-center">
        <div className="font-display text-lg font-medium text-[var(--ink)]">Human OS</div>
        <div className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
          Decoder
        </div>
      </div>

      <div className="relative mb-10 h-[72px] w-[72px]">
        <div className="absolute inset-0 rounded-full border border-[var(--hairline)]" />
        <div
          className="absolute inset-0 animate-spin rounded-full border border-transparent"
          style={{
            borderTopColor: "var(--accent)",
            borderRightColor: "var(--accent)",
            animationDuration: "1.6s",
          }}
        />
        <div
          className="absolute inset-7 animate-pulse rounded-full bg-[var(--accent)] opacity-60"
          style={{ animationDuration: "2.2s" }}
        />
      </div>

      <h1 className="font-display mb-8 text-center text-[23px] font-medium tracking-[-0.01em] text-[var(--ink)]">
        Mapping Your Innate Design
      </h1>

      <div className="mb-14 h-5 text-center text-[13.5px] text-[var(--ink-faint)]">
        {error ? (
          <div className="space-y-4">
            <p className="text-red-400">{error}</p>
            <button
              type="button"
              className="text-[var(--accent)] underline"
              onClick={() => router.push("/onboarding/birth")}
            >
              Back to birth details
            </button>
          </div>
        ) : (
          MESSAGES[msgIndex]
        )}
      </div>

      {!error && (
        <p className="text-center text-[11.5px] text-[var(--ink-faint)]">
          This can take a few minutes while we compile your profile and render all domains.
        </p>
      )}
    </div>
  );
}
