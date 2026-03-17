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
  const font = FONT_MAP[design.fontFamily ?? "sans"];
  const t = design.templateId ?? "clean";
  const tight = t === "minimal" || t === "compact";
  const spacious = t === "clean" || t === "professional" || t === "modern";

  const base = {
    page: {
      padding: tight ? 36 : 48,
      fontSize: tight ? 9 : 10,
      fontFamily: font,
    },
    name: {
      fontSize: tight ? 16 : 18,
      marginBottom: 4,
      fontFamily: font,
    },
    contact: {
      fontSize: tight ? 8 : 9,
      color: "#444",
      marginBottom: spacious ? 16 : 12,
      fontFamily: font,
    },
    sectionTitle: {
      fontSize: tight ? 10 : 11,
      fontWeight: "bold",
      marginTop: spacious ? 14 : 8,
      marginBottom: tight ? 4 : 6,
      borderBottomWidth: tight ? 0 : 1,
      borderBottomColor: "#ccc",
      paddingBottom: 2,
      fontFamily: font,
    },
    summary: { marginBottom: tight ? 6 : 8, lineHeight: 1.4, fontFamily: font },
    jobTitle: { fontWeight: "bold", marginBottom: 2, fontFamily: font },
    jobMeta: {
      fontSize: tight ? 8 : 9,
      color: "#555",
      marginBottom: 4,
      fontFamily: font,
    },
    bullet: {
      marginLeft: 12,
      marginBottom: tight ? 1 : 2,
      lineHeight: 1.35,
      fontFamily: font,
    },
    educationItem: { marginBottom: tight ? 4 : 6, fontFamily: font },
    skills: { lineHeight: 1.5, fontFamily: font },
  };

  return StyleSheet.create(base);
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
      <View>
        <Text style={styles.name}>{data.contact?.name || "Your Name"}</Text>
        <Text style={styles.contact}>
          {[data.contact?.email, data.contact?.phone, data.contact?.location]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>

      {data.summary && (
        <View>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.summary}>{data.summary}</Text>
        </View>
      )}

      {(data.experience ?? []).length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Experience</Text>
          {data.experience!.map((exp, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <Text style={styles.jobTitle}>
                {exp.role} at {exp.company}
              </Text>
              <Text style={styles.jobMeta}>
                {exp.start} – {exp.end}
                {exp.location ? ` · ${exp.location}` : ""}
              </Text>
              {exp.bullets?.map((b, j) => (
                <Text key={j} style={styles.bullet}>
                  • {b}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {(data.education ?? []).length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Education</Text>
          {data.education!.map((edu, i) => (
            <View key={i} style={styles.educationItem}>
              <Text style={styles.jobTitle}>
                {edu.degree}
                {edu.field ? ` in ${edu.field}` : ""}
              </Text>
              <Text style={styles.jobMeta}>
                {edu.school} · {edu.start} – {edu.end}
              </Text>
            </View>
          ))}
        </View>
      )}

      {(data.skills ?? []).length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.skills}>{data.skills!.join(", ")}</Text>
        </View>
      )}

      {(data.certifications ?? []).length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <Text style={styles.skills}>{data.certifications!.join(", ")}</Text>
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
