import { CreditsPill } from "@/components/CreditsPill";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function PeoplePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

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
      <p className="text-[14px] leading-relaxed text-[var(--ink-dim)]">
        Boss and Partner decoders ship in the next slice. Your Map is ready now.
      </p>
    </>
  );
}
