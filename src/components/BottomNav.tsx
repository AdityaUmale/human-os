"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", key: "map", label: "Map" },
  { href: "/people", key: "people", label: "People" },
  { href: "/interactions", key: "interactions", label: "Interactions" },
  { href: "/me", key: "me", label: "Me" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function active(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/map");
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 flex justify-center">
      <div
        className="flex h-[var(--navh)] w-full max-w-[360px] items-stretch justify-between border-t border-[var(--hairline)] bg-[rgba(10,10,12,0.86)] pb-[env(safe-area-inset-bottom)] backdrop-blur-[16px]"
      >
        {tabs.map((tab) => {
          const isActive = active(tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1.5 px-3.5 pb-3 pt-2"
            >
              <TabIcon name={tab.key} active={isActive} />
              <span
                className={`text-[10px] tracking-[0.05em] ${
                  isActive ? "font-medium text-[var(--ink)]" : "text-[var(--ink-faint)]"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "var(--ink)" : "var(--ink-faint)";
  if (name === "map") {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6">
        <path d="M9.5 2a3.5 3.5 0 00-3.5 3.5v.6A3 3 0 004 9v1a3 3 0 002 2.83V13a3.5 3.5 0 003.5 3.5M9.5 2A3.5 3.5 0 0113 5.5v11A3.5 3.5 0 019.5 20M9.5 2v18" />
      </svg>
    );
  }
  if (name === "people") {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6">
        <circle cx="8.5" cy="7.5" r="3" />
        <path d="M2.5 20c0-3.6 2.7-6.2 6-6.2s6 2.6 6 6.2" />
        <circle cx="16.5" cy="7.5" r="2.4" />
        <path d="M14.8 13.9c2.6.4 4.7 2.7 4.7 6.1" />
      </svg>
    );
  }
  if (name === "interactions") {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6">
        <circle cx="9" cy="12" r="6" />
        <circle cx="15" cy="12" r="6" />
      </svg>
    );
  }
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}
