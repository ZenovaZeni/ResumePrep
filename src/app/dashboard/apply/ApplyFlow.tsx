"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { ResumeData } from "@/types/resume";

type Result = {
  tailoredResumeData: ResumeData;
  coverLetter: string;
  applicationId?: string;
  variantId: string;
  documentId: string;
  resumeId?: string;
};

export function ApplyFlow() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [saveToApplications, setSaveToApplications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const LAST_USED_RESUME_KEY = "smart-resume-last-used-resume-id";
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/apply/one-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: jobDescription.trim(),
          job_title: jobTitle.trim() || undefined,
          company_name: companyName.trim() || undefined,
          save_to_applications: saveToApplications,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setResult({
        tailoredResumeData: data.tailoredResumeData,
        coverLetter: data.coverLetter,
        applicationId: data.applicationId,
        variantId: data.variantId,
        documentId: data.documentId,
      });
      if (typeof window !== "undefined" && data.resumeId) {
        window.localStorage.setItem(LAST_USED_RESUME_KEY, data.resumeId);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLetter() {
    if (!result) return;
    navigator.clipboard.writeText(result.coverLetter);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }

  async function handleExportPDF() {
    if (!result) return;
    setExporting("pdf");
    try {
      const { ResumePDFDocument } = await import("@/lib/resume-pdf");
      const blob = await pdf(<ResumePDFDocument data={result.tailoredResumeData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tailored-Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportDOCX() {
    if (!result) return;
    setExporting("docx");
    try {
      const data = result.tailoredResumeData;
      const children: Paragraph[] = [];
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: data.contact?.name || "Your Name",
              bold: true,
              size: 32,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: [data.contact?.email, data.contact?.phone, data.contact?.location]
                .filter(Boolean)
                .join(" · "),
              size: 22,
            }),
          ],
        }),
        new Paragraph({ text: "" })
      );
      if (data.summary) {
        children.push(
          new Paragraph({
            text: "Summary",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({ text: data.summary, spacing: { after: 200 } })
        );
      }
      if ((data.experience ?? []).length > 0) {
        children.push(
          new Paragraph({
            text: "Experience",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        for (const exp of data.experience!) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${exp.role} at ${exp.company}`,
                  bold: true,
                }),
              ],
              spacing: { before: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${exp.start} – ${exp.end}`,
                  italics: true,
                  size: 20,
                }),
              ],
            })
          );
          for (const b of exp.bullets ?? []) {
            children.push(
              new Paragraph({
                text: `• ${b}`,
                bullet: { level: 0 },
                spacing: { before: 50 },
              })
            );
          }
        }
        children.push(new Paragraph({ text: "" }));
      }
      if ((data.education ?? []).length > 0) {
        children.push(
          new Paragraph({
            text: "Education",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        for (const edu of data.education!) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${edu.school} · ${edu.start} – ${edu.end}`,
                  size: 20,
                }),
              ],
            })
          );
        }
      }
      if ((data.skills ?? []).length > 0) {
        children.push(
          new Paragraph({
            text: "Skills",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: data.skills!.join(", "),
          })
        );
      }
      const doc = new Document({
        sections: [{ properties: {}, children }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Tailored-Resume.docx";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  async function handleSaveToApplications() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/apply/save-to-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_id: result.variantId,
          document_id: result.documentId,
          company_name: companyName.trim() || "Company",
          job_title: jobTitle.trim() || "Role",
          job_description: jobDescription.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      router.push(`/dashboard/applications/${data.applicationId}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label htmlFor="job_description" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Paste job description *
          </label>
          <textarea
            id="job_description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
            rows={6}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Paste the full job description here..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="job_title" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Job title (optional)
            </label>
            <input
              id="job_title"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Senior Engineer"
            />
          </div>
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Company (optional)
            </label>
            <input
              id="company_name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Acme Inc"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="save_to_applications"
            type="checkbox"
            checked={saveToApplications}
            onChange={(e) => setSaveToApplications(e.target.checked)}
            className="rounded border-[var(--border-subtle)] text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="save_to_applications" className="text-sm text-[var(--text-secondary)]">
            Save to my applications
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate resume + cover letter"}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
          {error.includes("No resume") && (
            <span className="block mt-2">
              <Link href="/dashboard/resumes/new" className="underline">Create a resume first</Link>.
            </span>
          )}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-8 max-w-3xl">
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Tailored resume</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Download your tailored resume.</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={exporting !== null}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
              >
                {exporting === "pdf" ? "Generating…" : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={handleExportDOCX}
                disabled={exporting !== null}
                className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)] disabled:opacity-50"
              >
                {exporting === "docx" ? "Generating…" : "Download DOCX"}
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Cover letter</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Copy to clipboard or save to applications.</p>
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                type="button"
                onClick={handleCopyLetter}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
              >
                {copyDone ? "Copied!" : "Copy cover letter"}
              </button>
            </div>
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
              {result.coverLetter}
            </div>
          </section>

          {!result.applicationId && (
            <div>
              <button
                type="button"
                onClick={handleSaveToApplications}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save to my applications"}
              </button>
            </div>
          )}
          {result.applicationId && (
            <p className="text-sm text-[var(--text-secondary)]">
              Saved.{" "}
              <Link href={`/dashboard/applications/${result.applicationId}`} className="text-indigo-400 hover:underline">
                View application
              </Link>
            </p>
          )}
        </div>
      )}
    </>
  );
}
