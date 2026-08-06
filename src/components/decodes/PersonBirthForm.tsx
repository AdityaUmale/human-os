"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TIMEZONE_OPTIONS } from "@/lib/catalog/timezones";
import { readJsonSafe } from "@/lib/safe-json";

type PlaceResult = { label: string; placeName: string; lat: number; lng: number };

export function PersonBirthForm({ kind, returnTo }: { kind: string; returnTo?: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [timeOfBirth, setTimeOfBirth] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedKind = kind.toUpperCase();
  const label = normalizedKind[0] + normalizedKind.slice(1).toLowerCase();
  const valid = useMemo(() => Boolean(fullName.trim() && dateOfBirth && place && (timeUnknown || timeOfBirth)), [fullName, dateOfBirth, place, timeUnknown, timeOfBirth]);

  useEffect(() => {
    if (placeQuery.trim().length < 2 || place) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/places/search?q=${encodeURIComponent(placeQuery.trim())}`);
        const body = await readJsonSafe<{ results?: PlaceResult[] }>(response);
        setResults(body.data?.results ?? []);
      } catch {
        setResults([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [placeQuery, place]);

  async function submit() {
    if (!valid || !place || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: normalizedKind, birth: { fullName: fullName.trim(), dateOfBirth, timeOfBirth: timeUnknown ? null : timeOfBirth, timeUnknown, placeName: place.placeName, lat: place.lat, lng: place.lng, timezone } }),
      });
      const body = (await response.json()) as { decodeId?: string; subjectId?: string; error?: string; status?: string };
      if (!response.ok || !body.decodeId || !body.subjectId) throw new Error(body.error || "Could not start this decode.");
      const destination = returnTo || `/people/${body.subjectId}`;
      if (body.status === "EXISTING") return router.replace(destination);
      router.replace(`/decodes/${body.decodeId}/generating?return=${encodeURIComponent(destination)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start this decode.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="font-mono-label mb-3 text-[10.5px] tracking-[0.14em] text-[var(--accent)] uppercase">{label} Decoder</div>
        <h1 className="font-display mb-2 text-[32px] font-medium">{label} Decoder</h1>
        <p className="text-[13.5px] leading-[1.55] text-[var(--ink-faint)]">Understand this person through their {label.toLowerCase()} lens.</p>
      </div>
      <Field label={`${label} Name`}><input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Their name" className="field-input" /></Field>
      <div className="font-mono-label mb-3 mt-8 text-[10.5px] tracking-[0.14em] text-[var(--ink-faint)] uppercase">Birth Details</div>
      <Field label="Date of Birth"><input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="field-input" /></Field>
      <Field label="Birth Time"><input type="time" disabled={timeUnknown} value={timeOfBirth} onChange={(event) => setTimeOfBirth(event.target.value)} className="field-input disabled:opacity-40" /></Field>
      <label className="mb-7 flex items-center gap-2 text-[13px] text-[var(--ink-faint)]"><input type="checkbox" checked={timeUnknown} onChange={(event) => { setTimeUnknown(event.target.checked); if (event.target.checked) setTimeOfBirth(""); }} /> I don’t know the exact birth time</label>
      <Field label="Birth Place"><input value={place ? place.label : placeQuery} onChange={(event) => { setPlace(null); setPlaceQuery(event.target.value); setResults([]); }} placeholder="Search city of birth" className="field-input" />{results.length > 0 && !place && <ul className="mt-2 overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--bg-raised)]">{results.map((result) => <li key={`${result.label}-${result.lat}`}><button type="button" className="w-full border-b border-[var(--hairline-soft)] px-3 py-2.5 text-left text-[13px] text-[var(--ink-dim)] last:border-0" onClick={() => { setPlace(result); setPlaceQuery(result.placeName); setResults([]); }}>{result.label}</button></li>)}</ul>}</Field>
      <Field label="Timezone"><select value={timezone} onChange={(event) => setTimezone(event.target.value)} className="field-input appearance-none">{TIMEZONE_OPTIONS.map((option) => <option key={option.value} value={option.value} className="bg-[var(--bg)]">{option.label}</option>)}</select></Field>
      {error && <p className="mb-4 text-[13px] text-red-300">{error}</p>}
      <button type="button" disabled={!valid || loading} onClick={submit} className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--ink)] py-[15px] text-[14.5px] font-semibold text-[var(--bg)] disabled:opacity-35">{loading ? "Starting…" : `Generate ${label} Decode`} <span>→</span></button>
      <style jsx global>{`.field-input{width:100%;background:none;border:none;border-bottom:1px solid var(--hairline);color:var(--ink);font-family:inherit;font-size:16px;padding:8px 2px;outline:none}.field-input:focus{border-color:var(--accent)}.field-input::placeholder{color:var(--ink-faint)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-7"><label className="mb-2.5 block text-[12.5px] text-[var(--ink-faint)]">{label}</label>{children}</div>;
}
