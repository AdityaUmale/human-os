import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AddLensButton } from "@/components/decodes/AddLensButton";
import { DECODE_CATALOG } from "@/lib/decodes/catalog";
import { listPeople } from "@/lib/decodes/service";
import { requireUser } from "@/lib/session";

export default async function PersonHubPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { subjectId } = await params;
  const person = (await listPeople(user.id)).find((candidate) => candidate.id === subjectId);
  if (!person) notFound();
  const generated = new Set(person.primaryDecodes.map((decode) => decode.kind));
  const kinds = ["PARTNER", "BOSS", "PARENT", "CHILD", "EMPLOYEE", "COLLEAGUE"] as const;
  return <><Link href="/people" className="inline-flex items-center gap-1.5 pt-[22px] text-[13px] text-[var(--ink-faint)]">← People</Link><div className="pb-9 pt-10"><div className="font-mono-label mb-3 text-[10.5px] tracking-[0.14em] text-[var(--accent)] uppercase">Your Person</div><h1 className="font-display mb-2 text-[34px] font-medium">{person.displayName}</h1><p className="text-[13.5px] text-[var(--ink-faint)]">One Human OS, viewed through different relationship lenses.</p></div><div className="font-mono-label mb-3 text-[10px] tracking-[0.14em] text-[var(--ink-faint)] uppercase">Saved Lenses</div><div className="mb-9 flex flex-col gap-3">{person.primaryDecodes.map((decode) => { const catalog = DECODE_CATALOG[decode.kind as keyof typeof DECODE_CATALOG]; return <Link key={decode.id} href={`/people/${person.id}/${decode.kind.toLowerCase()}`} className="rounded-[14px] border border-[var(--hairline)] bg-[var(--bg-raised)] px-5 py-4"><div className="font-display text-[18px] font-medium text-[var(--ink)]">{catalog.title}</div><div className="mt-2 text-[12.5px] text-[var(--accent)]">{decode.status === "COMPLETED" ? "Open insights →" : decode.status === "FAILED" ? "Needs retry →" : "Rendering…"}</div></Link>; })}</div><div className="font-mono-label mb-3 text-[10px] tracking-[0.14em] text-[var(--ink-faint)] uppercase">Decode As</div><div className="flex flex-wrap gap-2">{kinds.filter((kind) => !generated.has(kind)).map((kind) => <AddLensButton key={kind} subjectId={person.id} kind={kind} label={DECODE_CATALOG[kind].title.replace(" Decoder", "")} />)}</div></>;
}
