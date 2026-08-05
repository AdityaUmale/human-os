export function CreditsPill({ balance }: { balance: number }) {
  return (
    <div className="font-mono-label flex items-center gap-1.5 rounded-full border border-[var(--hairline)] px-[11px] py-[5px] text-[11px] text-[var(--ink-dim)]">
      <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent)]" />
      {balance} Credits
    </div>
  );
}
