import { CreditsPill } from "@/components/CreditsPill";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

export default async function MePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const since = new Date(user.createdAt).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <div className="flex items-center justify-between pt-5 pb-2">
        <div className="font-display text-[19px] font-medium">Decoder</div>
        <CreditsPill balance={user.creditBalance} />
      </div>

      <div className="flex items-center gap-3.5 pb-[26px] pt-2">
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--bg-card)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-dim)" strokeWidth="1.6">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
          </svg>
        </div>
        <div>
          <div className="font-display text-[17px] font-medium">
            {user.name || user.birthDetails?.fullName || "Your File"}
          </div>
          <div className="font-mono-label text-[11px] text-[var(--ink-faint)]">
            MEMBER SINCE {since.toUpperCase()}
          </div>
        </div>
      </div>

      <Row label="Birth Details" value={user.birthDetails ? "Set" : "Not set"} />
      <Row label="Credits" value={String(user.creditBalance)} />
      <Row label="Phone" value={user.phone} />
      <Row label="Human OS" value={user.humanOs?.status ?? "—"} />

      <div className="mt-8">
        <LogoutButton />
      </div>

      <p className="font-mono-label mt-10 text-center text-[11px] tracking-[0.03em] text-[var(--ink-faint)]">
        Astrology for better decisions, not better predictions.
      </p>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--hairline-soft)] py-[15px]">
      <div className="text-sm text-[var(--ink)]">{label}</div>
      <div className="font-mono-label text-[12.5px] text-[var(--ink-faint)]">{value}</div>
    </div>
  );
}
