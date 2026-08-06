"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddLensButton({ subjectId, kind, label }: { subjectId: string; kind: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function add() {
    setBusy(true);
    const response = await fetch(`/api/people/${subjectId}/decodes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }) });
    const body = (await response.json()) as { decodeId?: string; status?: string };
    if (body.decodeId) {
      if (body.status === "EXISTING") router.push(`/people/${subjectId}/${kind.toLowerCase()}`);
      else router.push(`/decodes/${body.decodeId}/generating?return=${encodeURIComponent(`/people/${subjectId}`)}`);
    }
    setBusy(false);
  }
  return <button type="button" disabled={busy} onClick={add} className="rounded-[10px] border border-[var(--hairline)] px-3 py-2 text-left text-[12.5px] text-[var(--accent)] disabled:opacity-50">{busy ? "Starting…" : `Decode as ${label} →`}</button>;
}
