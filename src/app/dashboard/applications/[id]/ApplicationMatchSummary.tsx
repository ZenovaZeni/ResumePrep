"use client";

export interface MatchSummaryData {
  matchScore: number;
  topKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  suggestedAngle: string;
}

export function ApplicationMatchSummary({ summary }: { summary: MatchSummaryData }) {
  const score = summary.matchScore;
  const scoreColor =
    score >= 75 ? "text-emerald-400" : score >= 55 ? "text-amber-400" : "text-red-400";
  const barColor =
    score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-amber-400" : "bg-red-500";
  const scoreLabel = score >= 75 ? "Strong fit" : score >= 55 ? "Decent fit" : "Weak fit";

  return (
    <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border-subtle)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          Match analysis
        </p>
      </div>

      {/* Score row */}
      <div className="flex items-center gap-5 px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="shrink-0 text-center w-14">
          <span className={`text-3xl font-bold tabular-nums ${scoreColor}`}>{score}</span>
          <span className="text-sm text-[var(--text-tertiary)]">%</span>
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] mt-1.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider">
            {scoreLabel}
          </p>
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          {summary.matchedKeywords.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                Strong match
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.matchedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          {summary.missingKeywords.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                Address in cover letter
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.missingKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-400 border border-amber-500/25"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strengths and gaps */}
      {(summary.strengths.length > 0 || summary.gaps.length > 0) && (
        <div className="px-5 py-4 grid sm:grid-cols-2 gap-4 border-b border-[var(--border-subtle)]">
          {summary.strengths.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                Your strengths for this role
              </p>
              <ul className="space-y-1.5">
                {summary.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.gaps.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Worth addressing
              </p>
              <ul className="space-y-1.5">
                {summary.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Suggested angle */}
      {summary.suggestedAngle && (
        <div className="px-5 py-3 bg-[var(--accent)]/5">
          <p className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
            Suggested angle
          </p>
          <p className="text-xs text-[var(--text-primary)] leading-relaxed italic">
            {summary.suggestedAngle}
          </p>
        </div>
      )}
    </div>
  );
}
