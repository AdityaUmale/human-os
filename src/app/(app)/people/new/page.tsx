import Link from "next/link";
import { notFound } from "next/navigation";
import { PersonBirthForm } from "@/components/decodes/PersonBirthForm";
import { isPeopleDecoderType } from "@/lib/decodes/catalog";

export default async function NewPersonPage({ searchParams }: { searchParams: Promise<{ kind?: string; return?: string }> }) {
  const params = await searchParams;
  const kind = (params.kind || "").toUpperCase();
  if (!isPeopleDecoderType(kind)) notFound();
  return <><Link href={params.return || "/people"} className="inline-flex items-center gap-1.5 pt-[22px] text-[13px] text-[var(--ink-faint)]">← People</Link><div className="pb-10 pt-9"><PersonBirthForm kind={kind} returnTo={params.return} /></div></>;
}
