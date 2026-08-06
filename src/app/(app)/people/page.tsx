import { CreditsPill } from "@/components/CreditsPill";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DECODE_CATALOG } from "@/lib/decodes/catalog";
import { listPeople } from "@/lib/decodes/service";

export default async function PeoplePage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const people = await listPeople(user.id);
  const decoderKinds = ["BOSS", "PARTNER", "PARENT", "CHILD", "EMPLOYEE", "COLLEAGUE"] as const;

  return (
    <>
      <div className="flex items-center justify-between pt-5 pb-2">
        <div className="font-display text-[19px] font-medium">Decoder</div>
        <CreditsPill balance={user.creditBalance} />
      </div>
      <div className="pb-6 pt-2">
        <h1 className="font-display mb-1.5 text-[26px] font-medium">People</h1>
        <p className="text-[13.5px] text-[var(--ink-faint)]">
          Understand the people who shape your life.
        </p>
      </div>
      {people.length > 0 && <><div className="font-mono-label mb-3 text-[10px] tracking-[0.14em] text-[var(--ink-faint)] uppercase">Your People</div><div className="mb-9 flex flex-col">{people.map((person) => <Link key={person.id} href={`/people/${person.id}`} className="flex items-center justify-between border-b border-[var(--hairline)] py-4"><span><span className="font-display block text-[18px] font-medium text-[var(--ink)]">{person.displayName}</span><span className="text-[12px] text-[var(--ink-faint)]">{person.primaryDecodes.length} decoder{person.primaryDecodes.length === 1 ? "" : "s"} saved</span></span><span className="text-[var(--ink-faint)]">→</span></Link>)}</div></>}
      <div className="font-mono-label mb-3 text-[10px] tracking-[0.14em] text-[var(--ink-faint)] uppercase">Decode Someone</div>
      <div className="flex flex-col gap-3">{decoderKinds.map((kind) => { const catalog = DECODE_CATALOG[kind]; return <Link key={kind} href={`/people/new?kind=${kind}`} className="rounded-[14px] border border-[var(--hairline)] bg-[var(--bg-raised)] px-5 py-4"><div className="font-display mb-1 text-[18px] font-medium text-[var(--ink)]">{catalog.title.replace(" Decoder", "")}</div><div className="text-[13px] leading-[1.5] text-[var(--ink-faint)]">{catalog.subtitle}</div><div className="mt-3 text-[12.5px] font-semibold text-[var(--accent)]">Decode →</div></Link>; })}</div>
    </>
  );
}
