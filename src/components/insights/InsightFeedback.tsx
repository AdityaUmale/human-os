"use client";

import { useState } from "react";

const OPTIONS = ["Completely", "Mostly", "Somewhat", "Not really"] as const;

export function InsightFeedback({
  domain,
  insightKey,
}: {
  domain: string;
  insightKey: string;
}) {
  const [done, setDone] = useState(false);

  async function submit(rating: string) {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, insightKey, rating }),
    });
    setDone(true);
  }

  return (
    <div className="my-2">
      <div className="font-display mb-5 text-[16.5px] font-medium text-[var(--ink)]">
        How well did this explain you?
      </div>
      {done ? (
        <div className="flex items-center gap-2 text-[14px] text-[var(--ink-dim)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Thanks for your feedback.
        </div>
      ) : (
        <div className="flex flex-col gap-[15px]">
          {OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-3 text-sm text-[var(--ink-dim)]"
            >
              <input
                type="radio"
                name={`feedback-${insightKey}`}
                value={opt}
                onChange={() => submit(opt)}
                className="accent-[var(--accent)]"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
