import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell px-5 pb-[calc(var(--navh)+28px)]">
      {children}
      <BottomNav />
    </div>
  );
}
