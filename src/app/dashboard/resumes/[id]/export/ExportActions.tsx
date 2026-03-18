"use client";

import { useState } from "react";
import Link from "next/link";
import type { ResumeData } from "@/types/resume";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

interface ExportActionsProps {
  resumeId: string;
  resumeName: string;
  data: ResumeData;
}

export function ExportActions({ resumeId, resumeName, data }: ExportActionsProps) {
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

  async function handleExportPDF() {
    setExporting("pdf");
    try {
      const [{ pdf }, { ResumePDFDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/resume-pdf"),
      ]);
      const blob = await pdf(<ResumePDFDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeName.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportDOCX() {
    setExporting("docx");
    try {
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
        sections: [
          {
            properties: {},
            children,
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeName.replace(/\s+/g, "-")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-4">
      <button
        type="button"
        onClick={handleExportPDF}
        disabled={exporting !== null}
        className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
      >
        {exporting === "pdf" ? "Generating…" : "Download PDF"}
      </button>
      <button
        type="button"
        onClick={handleExportDOCX}
        disabled={exporting !== null}
        className="px-6 py-3 rounded-lg bg-zinc-700 text-white font-medium hover:bg-zinc-600 disabled:opacity-50"
      >
        {exporting === "docx" ? "Generating…" : "Download DOCX"}
      </button>
      <Link
        href={`/dashboard/resumes/${resumeId}`}
        className="px-6 py-3 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
      >
        Back to resume
      </Link>
    </div>
  );
}
