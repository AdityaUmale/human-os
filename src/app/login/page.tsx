"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readJsonOrThrow } from "@/lib/safe-json";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = phone.length === 10;

  async function continueWithPhone() {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await readJsonOrThrow<{
        error?: string;
        humanOsStatus?: string | null;
        hasBirthDetails?: boolean;
      }>(res);
      if (!res.ok) throw new Error(data.error || "Could not continue");

      if (data.humanOsStatus === "COMPLETED") {
        router.push("/");
      } else if (data.humanOsStatus === "GENERATING") {
        router.push("/onboarding/generating");
      } else if (data.hasBirthDetails) {
        router.push("/onboarding/generating");
      } else {
        router.push("/onboarding/birth");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell flex min-h-screen flex-col justify-center px-7 py-12">
      <div className="mb-14 text-center">
        <div className="font-display text-[22px] font-medium tracking-[0.01em] text-[var(--ink)]">
          Human OS
        </div>
        <div className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
          Decoder
        </div>
      </div>

      <div className="mb-14 space-y-1 text-center">
        <p className="font-display text-[19px] leading-[1.6] text-[var(--ink-dim)]">
          Understand your innate design.
        </p>
        <p className="font-display text-[19px] leading-[1.6] text-[var(--ink-dim)]">
          Understand your current season.
        </p>
        <p className="font-display text-[19px] leading-[1.6] text-[var(--ink-dim)]">
          Navigate life with greater clarity.
        </p>
      </div>

      <div className="mb-[18px] text-center text-[12.5px] text-[var(--ink-faint)]">
        Enter your mobile number
      </div>

      <div className="mb-7 flex items-center gap-3 border-b border-[var(--hairline)] pb-2.5 focus-within:border-[var(--accent)]">
        <span className="shrink-0 text-base text-[var(--ink-dim)]">+91</span>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="Mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className="w-full border-none bg-transparent text-base text-[var(--ink)] outline-none tracking-[0.02em] placeholder:text-[var(--ink-faint)]"
        />
      </div>

      {error && (
        <p className="mb-4 text-center text-[13px] text-red-400">{error}</p>
      )}

      <button
        type="button"
        disabled={!valid || loading}
        onClick={continueWithPhone}
        className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--ink)] py-3.5 text-[14.5px] font-semibold text-[var(--bg)] transition-opacity disabled:cursor-not-allowed disabled:opacity-35 active:opacity-75"
      >
        {loading ? "Continuing…" : "Continue"}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      <div className="mt-9 text-center text-[11px] leading-[1.6] text-[var(--ink-faint)]">
        By continuing, you agree to the
        <br />
        Terms of Service and Privacy Policy.
        <br />
        <span className="mt-2 inline-block text-[var(--ink-faint)] opacity-80">
          OTP verification is not required in this build.
        </span>
      </div>
    </div>
  );
}
