export function AccountSection({ email }: { email: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[var(--text-tertiary)]">Email</label>
      <p className="text-[var(--text-primary)]">{email || "—"}</p>
      <p className="text-xs text-[var(--text-tertiary)]">
        Your email is used to sign in. To change it, sign out and create a new account or use your provider’s account settings.
      </p>
    </div>
  );
}
