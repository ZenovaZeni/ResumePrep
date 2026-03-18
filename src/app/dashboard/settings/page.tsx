import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AccountSection } from "./AccountSection";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { BillingSection } from "./BillingSection";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?reason=session");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Settings
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage your account and subscription.
        </p>
      </div>

      {/* Two-column on desktop: account/security left, billing right */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 items-start space-y-6 lg:space-y-0">

        {/* Left: account + security */}
        <div className="space-y-6 min-w-0">
          <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Account</h2>
            <AccountSection email={user.email ?? ""} />
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Security</h2>
            <ChangePasswordForm />
          </section>
        </div>

        {/* Right: billing (sticky) */}
        <div className="lg:sticky lg:top-24">
          <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Billing</h2>
            <BillingSection tier={profile?.tier ?? "free"} />
          </section>
        </div>

      </div>
    </div>
  );
}
