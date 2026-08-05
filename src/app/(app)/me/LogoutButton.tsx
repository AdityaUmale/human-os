"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-[14px] text-[var(--ink-dim)] underline"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
      }}
    >
      Sign out
    </button>
  );
}
