import { TopBar } from "@/components/layout/TopBar";
import { MobileTabBar } from "@/components/layout/AppTabs";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-bg">
      <TopBar />
      <main
        className="relative z-10 flex-1 pb-20 md:pb-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
      >
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
