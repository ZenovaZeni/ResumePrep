export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div>
        <div className="h-8 w-24 bg-[var(--bg-elevated)] rounded-[var(--radius-md)] mb-2" />
        <div className="h-4 w-56 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]" />
      </div>
      <div className="space-y-8 max-w-xl">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6 h-32"
          />
        ))}
      </div>
    </div>
  );
}
