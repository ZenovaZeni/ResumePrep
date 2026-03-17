export default function ApplyLoading() {
  return (
    <div className="animate-pulse space-y-6 max-w-2xl">
      <div>
        <div className="h-8 w-36 bg-[var(--bg-elevated)] rounded-[var(--radius-md)] mb-2" />
        <div className="h-4 w-full max-w-md bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]" />
      </div>
      <div className="h-40 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 rounded-lg bg-[var(--bg-elevated)]" />
        <div className="h-10 rounded-lg bg-[var(--bg-elevated)]" />
      </div>
      <div className="h-10 w-56 rounded-lg bg-[var(--bg-elevated)]" />
    </div>
  );
}
