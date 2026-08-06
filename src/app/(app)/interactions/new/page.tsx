import Link from "next/link";
import { notFound } from "next/navigation";
import { InteractionPicker } from "@/components/decodes/InteractionPicker";
import { isInteractionType } from "@/lib/decodes/catalog";

export default async function NewInteractionPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const params = await searchParams;
  const kind = (params.kind || "").toUpperCase();
  if (!isInteractionType(kind)) notFound();
  return <><Link href="/interactions" className="inline-flex items-center gap-1.5 pt-[22px] text-[13px] text-[var(--ink-faint)]">← Interactions</Link><div className="pb-10 pt-9"><InteractionPicker kind={kind} /></div></>;
}
