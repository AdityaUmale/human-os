function humanize(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

export function DecodePayload({ payload }: { payload: Record<string, unknown> }) {
  return (
    <div className="text-[15px] leading-[1.75] text-[var(--read)]">
      {Object.entries(payload).map(([key, value]) => {
        if (key.startsWith("_") || value === null || value === undefined || value === "") return null;
        return <PayloadBlock key={key} label={humanize(key)} value={value} />;
      })}
    </div>
  );
}

function PayloadBlock({ label, value }: { label: string; value: unknown }) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <section className="mb-8"><h2 className="font-display mb-3 text-[19px] font-medium text-[var(--ink)]">{label}</h2><p>{String(value)}</p></section>;
  }
  if (Array.isArray(value)) {
    return <section className="mb-8"><h2 className="font-display mb-3 text-[19px] font-medium text-[var(--ink)]">{label}</h2><div className="flex flex-col gap-3">{value.map((item, index) => <div key={`${label}-${index}`} className="border-l border-[var(--accent-dim)] pl-3">{typeof item === "object" && item !== null ? <DecodePayload payload={item as Record<string, unknown>} /> : String(item)}</div>)}</div></section>;
  }
  if (typeof value === "object" && value !== null) {
    return <section className="mb-8"><h2 className="font-display mb-3 text-[19px] font-medium text-[var(--ink)]">{label}</h2><DecodePayload payload={value as Record<string, unknown>} /></section>;
  }
  return null;
}
