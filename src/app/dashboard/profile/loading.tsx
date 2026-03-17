export default function ProfileLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div>
        <div className="h-8 w-40 bg-[var(--bg-elevated)] rounded-[var(--radius-md)] mb-2" />
        <div className="h-4 w-96 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]" />
      </div>
      <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6 h-64" />
    </div>
  );
}
