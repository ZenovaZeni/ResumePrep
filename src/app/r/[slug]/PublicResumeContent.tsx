import type { ResumeData, ResumeDesignTemplateId } from "@/types/resume";

export function PublicResumeContent({
  data,
  theme,
}: {
  data: ResumeData;
  theme: ResumeDesignTemplateId;
}) {
  const isMinimal = theme === "minimal";
  const isProfessional = theme === "professional";
  const isModern = theme === "modern";
  const isCompact = theme === "compact";

  // Spacing: compact < minimal < clean < professional/modern
  const sectionMb = isCompact ? "mb-2" : isMinimal ? "mb-3" : isProfessional || isModern ? "mb-5" : "mb-6";
  const itemMb = isCompact ? "mb-1.5" : isMinimal ? "mb-2" : "mb-4";
  const headingMb = isCompact ? "mb-0.5" : isMinimal ? "mb-1" : "mb-2";

  const nameSize = isCompact ? "text-base" : isMinimal ? "text-xl" : "text-2xl";
  const metaSize = isCompact ? "text-[10px]" : isMinimal ? "text-xs" : "text-sm";
  const headingStyle = isProfessional
    ? "text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-300 pb-1"
    : isModern
      ? "text-xs font-semibold uppercase text-gray-500"
      : `text-xs font-semibold uppercase text-gray-500 ${headingMb}`;
  const roleStyle = isModern
    ? "font-bold text-gray-900"
    : "font-semibold";

  return (
    <>
      <div className={`${sectionMb} ${isProfessional ? "border-b-2 border-indigo-600 pb-3" : ""}`}>
        <h1 className={`${nameSize} font-bold ${isModern ? "text-gray-900" : ""}`}>
          {data.contact?.name || "Resume"}
        </h1>
        <p className={`${metaSize} text-gray-600 mt-1 ${isCompact ? "mt-0.5" : ""}`}>
          {[data.contact?.email, data.contact?.phone, data.contact?.location, data.contact?.linkedin, data.contact?.website]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {data.summary && (
        <section className={sectionMb}>
          <h2 className={headingStyle}>Summary</h2>
          <p className={isCompact ? "text-gray-800 text-xs leading-snug" : "text-gray-800"}>{data.summary}</p>
        </section>
      )}

      {(data.experience ?? []).length > 0 && (
        <section className={sectionMb}>
          <h2 className={headingStyle}>Experience</h2>
          {data.experience!.map((exp, i) => (
            <div key={i} className={itemMb}>
              <p className={roleStyle}>
                {exp.role} at {exp.company}
              </p>
              <p className={`${metaSize} text-gray-500`}>
                {exp.start} – {exp.end}
              </p>
              <ul className={`list-disc list-inside mt-1.5 text-gray-700 space-y-0.5 ${isCompact ? "text-xs" : "space-y-1"}`}>
                {exp.bullets?.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {(data.education ?? []).length > 0 && (
        <section className={sectionMb}>
          <h2 className={headingStyle}>Education</h2>
          {data.education!.map((edu, i) => (
            <div key={i} className={isCompact ? "mb-1" : isMinimal ? "mb-1" : "mb-2"}>
              <p className={roleStyle}>
                {edu.degree}
                {edu.field ? ` in ${edu.field}` : ""}
              </p>
              <p className="text-gray-600 text-sm">
                {edu.school} · {edu.start} – {edu.end}
              </p>
            </div>
          ))}
        </section>
      )}

      {(data.skills ?? []).length > 0 && (
        <section className={sectionMb}>
          <h2 className={headingStyle}>Skills</h2>
          <p className={isCompact ? "text-gray-800 text-xs" : "text-gray-800"}>{data.skills!.join(", ")}</p>
        </section>
      )}

      {(data.certifications ?? []).length > 0 && (
        <section className={sectionMb}>
          <h2 className={headingStyle}>Certifications</h2>
          <p className={isCompact ? "text-gray-800 text-xs" : "text-gray-800"}>{data.certifications!.join(", ")}</p>
        </section>
      )}

      {(data.projects ?? []).length > 0 && (
        <section className={sectionMb}>
          <h2 className={headingStyle}>Projects</h2>
          {data.projects!.map((proj, i) => (
            <div key={i} className={itemMb}>
              <p className={roleStyle}>{proj.name}</p>
              {proj.description && <p className="text-gray-700 text-sm">{proj.description}</p>}
              {proj.bullets && proj.bullets.length > 0 && (
                <ul className="list-disc list-inside mt-1 text-gray-700 space-y-0.5 text-sm">
                  {proj.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {(data.achievements ?? []).length > 0 && (
        <section>
          <h2 className={headingStyle}>Achievements</h2>
          <ul className={`list-disc list-inside text-gray-800 ${isCompact ? "text-xs" : "text-sm"} space-y-0.5`}>
            {data.achievements!.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
