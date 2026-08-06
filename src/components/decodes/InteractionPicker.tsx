"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Subject = { id: string; name: string; kind: string };

export function InteractionPicker({ kind }: { kind: string }) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [first, setFirst] = useState<Subject | null>(null);
  const [second, setSecond] = useState<Subject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/interactions?picker=1").then((response) => response.json()).then((body: { subjects?: Subject[] }) => setSubjects(body.subjects ?? [])).catch(() => setError("Could not load your people.")); }, []);

  async function generate() {
    if (!first || !second || loading) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/interactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, subjectAId: first.id, subjectBId: second.id }) });
      const body = (await response.json()) as { decodeId?: string; error?: string; status?: string };
      if (!response.ok || !body.decodeId) throw new Error(body.error || "Could not generate this interaction.");
      const destination = `/interactions/${body.decodeId}`;
      if (body.status === "EXISTING") router.replace(destination);
      else router.replace(`/decodes/${body.decodeId}/generating?return=${encodeURIComponent(destination)}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not generate this interaction."); setLoading(false); }
  }

  const choices = first ? subjects.filter((subject) => subject.id !== first.id) : subjects;
  return <div>
    <div className="mb-8"><div className="font-mono-label mb-3 text-[10.5px] tracking-[0.14em] text-[var(--accent)] uppercase">{kind === "LOVE_COMPAT" ? "Love Compatibility" : "Work Compatibility"}</div><h1 className="font-display mb-2 text-[32px] font-medium">{first ? "Select Second Person" : "Select First Person"}</h1><p className="text-[13.5px] leading-[1.55] text-[var(--ink-faint)]">Choose two Human OS profiles to understand what naturally emerges between them.</p></div>
    {subjects.length < 2 && <div className="mb-6 rounded-[14px] border border-[var(--hairline)] bg-[var(--bg-raised)] p-5 text-[13.5px] leading-relaxed text-[var(--ink-faint)]">Add at least one person to compare with “You.” <button type="button" className="mt-3 block text-[var(--accent)]" onClick={() => router.push(`/people/new?kind=${kind === "LOVE_COMPAT" ? "PARTNER" : "COLLEAGUE"}&return=${encodeURIComponent(`/interactions/new?kind=${kind}`)}`)}>Add a person →</button></div>}
    <div className="flex flex-col">{choices.map((subject) => <button key={subject.id} type="button" onClick={() => first ? setSecond(subject) : setFirst(subject)} className={`flex items-center justify-between border-b border-[var(--hairline)] py-4 text-left ${second?.id === subject.id ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}><span><span className="font-display block text-[18px] font-medium">{subject.name}</span><span className="font-mono-label text-[10px] tracking-[0.12em] text-[var(--accent-dim)] uppercase">{subject.kind === "SELF" ? "You" : "Saved person"}</span></span><span className="text-[var(--ink-faint)]">{second?.id === subject.id ? "Selected" : "→"}</span></button>)}</div>
    {first && <button type="button" className="mt-4 text-[12.5px] text-[var(--ink-faint)] underline" onClick={() => { setFirst(null); setSecond(null); }}>Choose a different first person</button>}
    {error && <p className="mt-5 text-[13px] text-red-300">{error}</p>}
    <button type="button" disabled={!first || !second || loading} onClick={generate} className="mt-8 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--ink)] py-[15px] text-[14.5px] font-semibold text-[var(--bg)] disabled:opacity-35">{loading ? "Starting…" : "Generate Compatibility →"}</button>
  </div>;
}
