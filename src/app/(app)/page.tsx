import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditsPill } from "@/components/CreditsPill";
import { MAP_DOMAINS } from "@/lib/catalog/domains";
import { requireUser } from "@/lib/session";

export default async function MapPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  if (!user.birthDetails) redirect("/onboarding/birth");
  if (!user.humanOs || user.humanOs.status === "GENERATING") {
    redirect("/onboarding/generating");
  }
  if (user.humanOs.status === "FAILED") {
    redirect("/onboarding/birth");
  }

  return (
    <>
      <div className="flex items-center justify-between pt-5 pb-2">
        <div className="font-display text-[19px] font-medium tracking-[0.01em]">Decoder</div>
        <CreditsPill balance={user.creditBalance} />
      </div>

      <div className="pb-[26px] pt-2">
        <h1 className="font-display mb-1.5 text-[26px] font-medium tracking-[-0.01em] text-[var(--ink)]">
          Your Map
        </h1>
        <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--ink-faint)]">
          Eight dimensions of you, waiting to be explored.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-[11px]">
        {MAP_DOMAINS.map((d) => {
          const classes = [
            "tile min-h-[128px] rounded-[var(--radius)] border border-[var(--hairline)] bg-[var(--bg-raised)] p-5 text-left transition-all",
          ];
          if ("hero" in d && d.hero) {
            classes.push("col-span-2 min-h-[150px] bg-gradient-to-b from-[var(--bg-card)] to-[#101012] p-6");
          } else if ("wide" in d && d.wide) {
            classes.push("col-span-2");
          }
          if ("accent" in d && d.accent) {
            classes.push("border-t-2 border-t-[var(--accent-dim)]");
          }

          const inner = (
            <>
              <div>
                <div
                  className={`font-display mb-1 font-medium text-[var(--ink)] ${
                    "hero" in d && d.hero ? "text-[23px]" : "text-[17.5px]"
                  }`}
                >
                  {d.title}
                </div>
                <div className="text-[12.5px] leading-[1.45] text-[var(--ink-faint)]">{d.desc}</div>
                {!d.available && (
                  <div className="mt-2 text-[11px] text-[var(--accent-dim)]">Coming soon</div>
                )}
              </div>
              <div className="mt-3.5 flex justify-end">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </>
          );

          if (d.available) {
            return (
              <Link key={d.key} href={`/map/${d.key}`} className={classes.join(" ")}>
                {inner}
              </Link>
            );
          }

          return (
            <div key={d.key} className={`${classes.join(" ")} cursor-default opacity-80`}>
              {inner}
            </div>
          );
        })}
      </div>
    </>
  );
}
