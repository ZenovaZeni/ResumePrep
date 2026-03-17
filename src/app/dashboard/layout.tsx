import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNavProvider } from "./DashboardNavContext";
import { DashboardNav } from "./DashboardNav";
import { BottomNav } from "./BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?reason=session");
  }

  return (
    <DashboardNavProvider>
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
        <header className="sticky top-0 z-50 glass border-b border-[var(--border-subtle)] safe-area-top">
          <DashboardNav />
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 pb-safe md:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </DashboardNavProvider>
  );
}
