export default function ApplicationsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-[var(--bg-elevated)] rounded-[var(--radius-md)]" />
        <div className="h-10 w-32 bg-[var(--bg-elevated)] rounded-[var(--radius-md)]" />
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="h-12 bg-[var(--bg-elevated)]" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 border-t border-[var(--border-subtle)]" />
        ))}
      </div>
    </div>
  );
}
