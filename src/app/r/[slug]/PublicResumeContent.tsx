import type { ResumeData, ResumeDesignTemplateId } from "@/types/resume";

export function PublicResumeContent({
  data,
  theme,
}: {
  data: ResumeData;
  theme: ResumeDesignTemplateId;
}) {
  const isCompact     = theme === "compact";
  const isProfessional = theme === "professional";
  // "clean", "minimal", "modern" all use the clean/minimal aesthetic
  const isClean = !isCompact && !isProfessional;

  // ── Typography scale ──────────────────────────────────────────────────────
  const nameSize   = isCompact ? "text-base font-bold" : isProfessional ? "text-3xl font-bold" : "text-2xl font-bold";
  const bodyText   = isCompact ? "text-[11px] leading-snug" : isProfessional ? "text-sm leading-relaxed" : "text-sm leading-relaxed";
  const metaText   = isCompact ? "text-[10px] text-gray-500" : "text-xs text-gray-500";

  // ── Spacing ───────────────────────────────────────────────────────────────
  const sectionGap = isCompact ? "mb-2.5" : isProfessional ? "mb-6" : "mb-5";
  const itemGap    = isCompact ? "mb-1.5" : isProfessional ? "mb-4" : "mb-3";
  const bulletGap  = isCompact ? "space-y-0.5 text-[11px]" : "space-y-1";

  // ── Section heading style ─────────────────────────────────────────────────
  // Professional: full-width underline with gray border
  // Clean: subtle dot separator on the left, accent color
  // Compact: all-caps tiny label, no decoration
  function SectionHeading({ children }: { children: React.ReactNode }) {
    if (isProfessional) {
      return (
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-700 border-b-2 border-gray-800 pb-1 mb-2">
          {children}
        </h2>
      );
    }
    if (isCompact) {
      return (
        <h2 className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">
          {children}
        </h2>
      );
    }
    // clean / minimal / modern
    return (
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
        {children}
      </h2>
    );
  }

  // ── Role / company line ───────────────────────────────────────────────────
  const roleStyle = isProfessional
    ? "font-bold text-gray-900"
    : isCompact
      ? "font-semibold text-gray-800 text-[11px]"
      : "font-semibold text-gray-900";

  // ── Skills display ────────────────────────────────────────────────────────
  // Professional: comma list; Clean: pill chips; Compact: comma list small
  function SkillList({ skills }: { skills: string[] }) {
    if (isProfessional || isCompact) {
      return (
        <p className={`text-gray-700 ${isCompact ? "text-[11px]" : "text-sm"}`}>
          {skills.join(", ")}
        </p>
      );
    }
    return (
      <div className="flex flex-wrap gap-1">
        {skills.map((s, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200">
            {s}
          </span>
        ))}
      </div>
    );
  }

  const hasCerts    = (data.certifications ?? []).length > 0;
  const hasProjects = (data.projects ?? []).length > 0;
  const hasAchieves = (data.achievements ?? []).length > 0;

  return (
    <article className={bodyText}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className={`${sectionGap} ${isProfessional ? "border-b-[3px] border-gray-900 pb-3" : ""}`}>
        <h1 className={nameSize}>{data.contact?.name || "Resume"}</h1>
        {isProfessional ? (
          // Two-line contact for professional: email | phone | location on first line
          <p className={`${metaText} mt-1`}>
            {[data.contact?.email, data.contact?.phone, data.contact?.location]
              .filter(Boolean)
              .join("  |  ")}
          </p>
        ) : (
          <p className={`${metaText} mt-1`}>
            {[data.contact?.email, data.contact?.phone, data.contact?.location, data.contact?.linkedin, data.contact?.website]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </header>

      {/* ── Summary ────────────────────────────────────────────────────── */}
      {data.summary && (
        <section className={sectionGap}>
          <SectionHeading>Summary</SectionHeading>
          <p className="text-gray-700">{data.summary}</p>
        </section>
      )}

      {/* ── Experience ─────────────────────────────────────────────────── */}
      {(data.experience ?? []).length > 0 && (
        <section className={sectionGap}>
          <SectionHeading>Experience</SectionHeading>
          {data.experience!.map((exp, i) => (
            <div key={i} className={itemGap}>
              <div className={isProfessional ? "flex justify-between items-baseline" : ""}>
                <p className={roleStyle}>
                  {exp.role}
                  {isProfessional ? " — " : " at "}
                  {exp.company}
                </p>
                <p className={metaText}>{exp.start} – {exp.end}</p>
              </div>
              {!isProfessional && <p className={metaText}>{exp.start} – {exp.end}</p>}
              {(exp.bullets ?? []).length > 0 && (
                <ul className={`list-disc list-inside mt-1 text-gray-700 ${bulletGap}`}>
                  {exp.bullets!.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── Education ──────────────────────────────────────────────────── */}
      {(data.education ?? []).length > 0 && (
        <section className={sectionGap}>
          <SectionHeading>Education</SectionHeading>
          {data.education!.map((edu, i) => (
            <div key={i} className={itemGap}>
              <div className={isProfessional ? "flex justify-between items-baseline" : ""}>
                <p className={roleStyle}>
                  {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                </p>
                <p className={metaText}>{edu.start} – {edu.end}</p>
              </div>
              <p className={metaText}>{edu.school}{!isProfessional ? ` · ${edu.start} – ${edu.end}` : ""}</p>
            </div>
          ))}
        </section>
      )}

      {/* ── Skills ─────────────────────────────────────────────────────── */}
      {(data.skills ?? []).length > 0 && (
        <section className={sectionGap}>
          <SectionHeading>Skills</SectionHeading>
          <SkillList skills={data.skills!} />
        </section>
      )}

      {/* ── Certifications ─────────────────────────────────────────────── */}
      {hasCerts && (
        <section className={sectionGap}>
          <SectionHeading>Certifications</SectionHeading>
          <p className={`text-gray-700 ${isCompact ? "text-[11px]" : "text-sm"}`}>
            {(data.certifications as string[]).join(", ")}
          </p>
        </section>
      )}

      {/* ── Projects ───────────────────────────────────────────────────── */}
      {hasProjects && (
        <section className={sectionGap}>
          <SectionHeading>Projects</SectionHeading>
          {(data.projects ?? []).map((proj, i) => (
            <div key={i} className={itemGap}>
              <p className={roleStyle}>
                {proj.name}
                {proj.url ? <a href={proj.url} className="text-gray-500 font-normal ml-2 text-xs">{proj.url}</a> : null}
              </p>
              {proj.description && <p className="text-gray-700 text-sm">{proj.description}</p>}
              {(proj.bullets ?? []).length > 0 && (
                <ul className={`list-disc list-inside mt-1 text-gray-700 ${bulletGap}`}>
                  {proj.bullets!.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── Achievements ───────────────────────────────────────────────── */}
      {hasAchieves && (
        <section>
          <SectionHeading>Achievements</SectionHeading>
          <ul className={`list-disc list-inside text-gray-700 ${bulletGap}`}>
            {(data.achievements as string[]).map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </section>
      )}
    </article>
  );
}
