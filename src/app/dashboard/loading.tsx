export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div>
        <div className="h-8 w-48 bg-[var(--bg-elevated)] rounded-[var(--radius-md)] mb-2" />
        <div className="h-4 w-72 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6 h-48" />
        <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6 h-48" />
      </div>
    </div>
  );
}
