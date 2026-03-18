"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumeData } from "@/types/resume";
import { getDefaultDesign, type ResumeDesign } from "@/types/resume";

const FONT_MAP = { sans: "Helvetica", serif: "Times-Roman" } as const;

function createStyles(design: ResumeDesign) {
  const font   = FONT_MAP[design.fontFamily ?? "sans"];
  const boldFont = font === "Times-Roman" ? "Times-Bold" : "Helvetica-Bold";
  const t      = design.templateId ?? "clean";
  const isCompact      = t === "compact";
  const isProfessional = t === "professional";

  // Professional: generous A4 margins, larger name, thick section title underline
  // Compact: tight padding, smaller type
  // Clean/others: balanced
  const pagePadding   = isCompact ? 28 : isProfessional ? 48 : 36;
  const bodySize      = isCompact ? 8.5 : 10;
  const nameFontSize  = isCompact ? 14 : isProfessional ? 22 : 18;
  const contactSize   = isCompact ? 7.5 : 9;
  const sectionGap    = isCompact ? 6 : isProfessional ? 14 : 10;
  const itemGap       = isCompact ? 3 : isProfessional ? 7 : 5;
  const bulletMb      = isCompact ? 0.5 : 1.5;

  return StyleSheet.create({
    page: {
      padding: pagePadding,
      fontSize: bodySize,
      fontFamily: font,
      color: "#111827",
    },
    name: {
      fontSize: nameFontSize,
      fontFamily: boldFont,
      marginBottom: isProfessional ? 4 : 2,
    },
    contact: {
      fontSize: contactSize,
      color: "#4b5563",
      marginBottom: 2,
    },
    headerBorderBottom: {
      borderBottomWidth: isProfessional ? 2 : 0,
      borderBottomColor: "#111827",
      paddingBottom: isProfessional ? 6 : 0,
      marginBottom: sectionGap,
    },
    sectionTitle: {
      fontSize: isCompact ? 7 : 8,
      fontFamily: boldFont,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      color: isProfessional ? "#111827" : "#6b7280",
      borderBottomWidth: isProfessional ? 1.5 : 0,
      borderBottomColor: "#111827",
      paddingBottom: isProfessional ? 2 : 0,
      marginBottom: isCompact ? 2 : 4,
      marginTop: sectionGap,
    },
    itemBlock: { marginBottom: itemGap },
    roleRow: { flexDirection: "row", justifyContent: "space-between" },
    roleText: { fontFamily: boldFont, fontSize: bodySize },
    metaText: { fontSize: isCompact ? 7.5 : 9, color: "#6b7280" },
    bullet: {
      marginLeft: 10,
      marginBottom: bulletMb,
      lineHeight: 1.35,
    },
    plainText: { lineHeight: 1.5 },
  });
}

function ResumePageContent({
  data,
  styles,
}: {
  data: ResumeData;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <>
      {/* Header */}
      <View style={styles.headerBorderBottom}>
        <Text style={styles.name}>{data.contact?.name || "Your Name"}</Text>
        <Text style={styles.contact}>
          {[data.contact?.email, data.contact?.phone, data.contact?.location, data.contact?.linkedin, data.contact?.website]
            .filter(Boolean)
            .join("  ·  ")}
        </Text>
      </View>

      {/* Summary */}
      {data.summary && (
        <View>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.plainText}>{data.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {(data.experience ?? []).length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Experience</Text>
          {data.experience!.map((exp, i) => (
            <View key={i} style={styles.itemBlock}>
              <View style={styles.roleRow}>
                <Text style={styles.roleText}>{exp.role} — {exp.company}</Text>
                <Text style={styles.metaText}>{exp.start} – {exp.end}</Text>
              </View>
              {exp.bullets?.map((b, j) => (
                <Text key={j} style={styles.bullet}>• {b}</Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Education */}
      {(data.education ?? []).length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Education</Text>
          {data.education!.map((edu, i) => (
            <View key={i} style={styles.itemBlock}>
              <View style={styles.roleRow}>
                <Text style={styles.roleText}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</Text>
                <Text style={styles.metaText}>{edu.start} – {edu.end}</Text>
              </View>
              <Text style={styles.metaText}>{edu.school}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Skills */}
      {(data.skills ?? []).length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.plainText}>{data.skills!.join(", ")}</Text>
        </View>
      )}

      {/* Certifications */}
      {(data.certifications ?? []).length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <Text style={styles.plainText}>{(data.certifications as string[]).join(", ")}</Text>
        </View>
      )}

      {/* Projects */}
      {(data.projects ?? []).length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Projects</Text>
          {(data.projects ?? []).map((proj, i) => (
            <View key={i} style={styles.itemBlock}>
              <Text style={styles.roleText}>{proj.name}</Text>
              {proj.description ? <Text style={styles.plainText}>{proj.description}</Text> : null}
              {(proj.bullets ?? []).map((b, j) => (
                <Text key={j} style={styles.bullet}>• {b}</Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Achievements */}
      {(data.achievements ?? []).length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {(data.achievements as string[]).map((a, i) => (
            <Text key={i} style={styles.bullet}>• {a}</Text>
          ))}
        </View>
      )}
    </>
  );
}

export function ResumePDFDocument({
  data,
  design: designProp,
}: {
  data: ResumeData;
  design?: ResumeDesign | null;
}) {
  const design = getDefaultDesign(designProp ?? data.design);
  const styles = createStyles(design);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ResumePageContent data={data} styles={styles} />
      </Page>
    </Document>
  );
}
