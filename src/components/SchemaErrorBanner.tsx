/**
 * Shown when a Supabase query returns a schema-cache or table-not-found error.
 * Gives the user a clear diagnosis and the exact recovery step.
 */
export function SchemaErrorBanner({
  error,
  table,
}: {
  error: string | null | undefined;
  table?: string;
}) {
  if (!error) return null;

  const isSchemaCache =
    error.includes("schema cache") ||
    error.includes("table") ||
    error.includes("relation") ||
    error.includes("does not exist");

  return (
    <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <p className="font-semibold text-amber-300 mb-1">
        Database setup required
      </p>
      {isSchemaCache ? (
        <>
          <p className="text-amber-200/80 mb-2">
            {table
              ? `The "${table}" table is missing or the schema cache is stale.`
              : "A required database table is missing or the schema cache is stale."}
          </p>
          <p className="text-amber-200/80 mb-2">
            To fix this, open your{" "}
            <strong className="text-amber-200">Supabase Dashboard → SQL Editor</strong> and run the
            contents of <code className="bg-amber-500/20 px-1 rounded">supabase/fix_all_tables.sql</code>.
            That file is safe to run on any database — it creates tables only if they don&apos;t exist.
          </p>
          <p className="text-amber-200/60 text-xs">
            Technical detail: {error}
          </p>
        </>
      ) : (
        <p className="text-amber-200/80">{error}</p>
      )}
    </div>
  );
}
