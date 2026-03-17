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
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">
        Settings
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        Manage your account and subscription.
      </p>

      <div className="space-y-8 max-w-xl">
        <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">Account</h2>
          <AccountSection email={user.email ?? ""} />
        </section>

        <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">Security</h2>
          <ChangePasswordForm />
        </section>

        <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">Billing</h2>
          <BillingSection tier={profile?.tier ?? "free"} />
        </section>
      </div>
    </div>
  );
}
