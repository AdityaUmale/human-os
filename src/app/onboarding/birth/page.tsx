"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TIMEZONE_OPTIONS } from "@/lib/catalog/timezones";
import { readJsonOrThrow, readJsonSafe } from "@/lib/safe-json";

type PlaceResult = {
  label: string;
  placeName: string;
  lat: number;
  lng: number;
};

export default function BirthDetailsPage() {
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

  const valid = useMemo(() => {
    return Boolean(fullName.trim() && dateOfBirth && place && (timeUnknown || timeOfBirth));
  }, [fullName, dateOfBirth, place, timeUnknown, timeOfBirth]);

  useEffect(() => {
    if (placeQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(placeQuery.trim())}`);
        const { data } = await readJsonSafe<{ results?: PlaceResult[] }>(res);
        setResults(data?.results ?? []);
      } catch {
        setResults([]);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [placeQuery]);

  async function submit() {
    if (!valid || !place || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/human-os/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          dateOfBirth,
          timeOfBirth: timeUnknown ? null : timeOfBirth,
          timeUnknown,
          placeName: place.placeName,
          lat: place.lat,
          lng: place.lng,
          timezone,
        }),
      });
      const data = await readJsonOrThrow<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Could not start generation");
      router.push("/onboarding/generating");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell px-7 pb-14 pt-12">
      <div className="mb-11 text-center">
        <div className="font-display text-xl font-medium text-[var(--ink)]">Human OS</div>
        <div className="mt-1 text-[10.5px] font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
          Decoder
        </div>
      </div>

      <h1 className="font-display mb-4 text-center text-[28px] font-medium tracking-[-0.01em] text-[var(--ink)]">
        Birth Details
      </h1>
      <div className="mb-11 space-y-2.5 text-center text-[13.5px] leading-[1.65] text-[var(--ink-faint)]">
        <p>Your birth details are used to map your innate design.</p>
        <p>The more accurate they are, the more precise your Human OS becomes.</p>
      </div>

      <Field label="Full Name">
        <input
          type="text"
          placeholder="Your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="field-input"
        />
      </Field>

      <Field label="Date of Birth">
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="field-input"
        />
      </Field>

      <Field label="Time of Birth">
        <input
          type="time"
          value={timeOfBirth}
          disabled={timeUnknown}
          onChange={(e) => setTimeOfBirth(e.target.value)}
          className="field-input disabled:text-[var(--ink-faint)]"
        />
      </Field>

      <label className="mb-1 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={timeUnknown}
          onChange={(e) => {
            setTimeUnknown(e.target.checked);
            if (e.target.checked) setTimeOfBirth("");
          }}
          className="mt-0.5"
        />
        <span className="text-[13px] text-[var(--ink-dim)]">I don&apos;t know my birth time</span>
      </label>
      {timeUnknown && (
        <p className="mb-6 ml-6 text-xs leading-[1.55] text-[var(--ink-faint)]">
          We&apos;ll still generate your Human OS using the information available. Some insights may
          be less precise.
        </p>
      )}

      <Field label="Birth Place">
        <input
          type="text"
          placeholder="Search city of birth"
          value={place ? place.label : placeQuery}
          onChange={(e) => {
            setPlace(null);
            setPlaceQuery(e.target.value);
          }}
          className="field-input"
        />
        {results.length > 0 && !place && (
          <ul className="mt-2 overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--bg-raised)]">
            {results.map((r) => (
              <li key={r.label + r.lat}>
                <button
                  type="button"
                  className="w-full border-b border-[var(--hairline-soft)] px-3 py-2.5 text-left text-[13px] text-[var(--ink-dim)] last:border-0 hover:bg-[var(--bg-card)]"
                  onClick={() => {
                    setPlace(r);
                    setPlaceQuery(r.placeName);
                    setResults([]);
                  }}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Field>

      <Field label="Timezone">
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="field-input appearance-none"
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value} className="bg-[var(--bg)]">
              {tz.label}
            </option>
          ))}
        </select>
      </Field>

      {error && <p className="mb-4 text-center text-[13px] text-red-400">{error}</p>}

      <button
        type="button"
        disabled={!valid || loading}
        onClick={submit}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--ink)] py-[15px] text-[14.5px] font-semibold text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-35 active:opacity-75"
      >
        {loading ? "Starting…" : "Generate My Human OS"}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      <p className="mt-6 text-center text-[11.5px] leading-[1.6] text-[var(--ink-faint)]">
        You can update your birth details later from your profile.
      </p>

      <style jsx global>{`
        .field-input {
          width: 100%;
          background: none;
          border: none;
          border-bottom: 1px solid var(--hairline);
          color: var(--ink);
          font-family: inherit;
          font-size: 16px;
          padding: 8px 2px;
          outline: none;
        }
        .field-input:focus {
          border-color: var(--accent);
        }
        .field-input::placeholder {
          color: var(--ink-faint);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <label className="mb-2.5 block text-[12.5px] text-[var(--ink-faint)]">{label}</label>
      {children}
    </div>
  );
}
