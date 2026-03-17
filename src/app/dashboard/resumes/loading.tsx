export default function ResumesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-[var(--bg-elevated)] rounded-[var(--radius-md)]" />
        <div className="h-10 w-28 bg-[var(--bg-elevated)] rounded-[var(--radius-md)]" />
      </div>
      <ul className="space-y-3">
        {[1, 2, 3].map((i) => (
          <li
            key={i}
            className="h-16 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          />
        ))}
      </ul>
    </div>
  );
}
