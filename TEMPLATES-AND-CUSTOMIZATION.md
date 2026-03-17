# Resume & Cover Letter Templates, Fonts, and Customization – Plan

This doc covers **where to get** template designs, **how** to implement them, **what** users can customize, and **phased** features.

---

## Current state (what you have today)

| Area | What exists | What’s missing |
|------|-------------|----------------|
| **Resume “templates”** | 5 **content** templates (Entry, Professional, Technical, Executive, Creative) – they only change the **AI writing style**, not layout or look. | No **design** templates (layout, fonts, colors). |
| **Resume PDF** | Single layout in `src/lib/resume-pdf.tsx`: Helvetica, one column, fixed spacing. | No template choice, no font choice, no theme. |
| **Resume public page** | `/r/[slug]`: one HTML layout (Tailwind), no theme option. | ROADMAP 7.3: “Clean vs Minimal” not done. |
| **Resume DOCX** | Single structure in `ExportActions.tsx`, default docx styling. | No template or font selection. |
| **Cover letter** | Plain text in DB; shown in `<pre>`. No export layout. | No design template, no PDF/DOCX export, no font/theme. |

So: **design templates** and **font/theme** customization are the main gaps.

---

## 1. Where to get template designs

### Option A: Build in-house (recommended to start)

- **Resumes:** Add 2–3 **layout** templates in your repo (e.g. `src/lib/resume-templates/`).
  - Each template = React component(s) that render the same `ResumeData` with different:
    - Section order (e.g. Summary first vs Experience first)
    - Name/contact treatment (centered vs left, with/without line)
    - Section title style (underline, caps, color bar)
    - Density (compact vs spacious)
  - **PDF:** Use `@react-pdf/renderer` – one component per design; switch by `templateId`.
  - **Web/print:** Same data, different CSS or component per template (e.g. `/r/[slug]` and editor preview).
  - **DOCX:** Either one layout with optional font/size, or 2–3 docx “themes” built with `docx` (Paragraph/Style options).
- **Cover letters:** Same idea: 2–3 HTML/PDF “letter” layouts (e.g. formal block, modern with header, minimal).

**Pros:** Full control, no licensing, matches your stack.  
**Cons:** You own design and maintenance.

### Option B: Use or buy template packs

- **Marketplaces:** Creative Market, Etsy, etc. sell resume PSD/Word/InDesign templates. You’d need to **reimplement** them as React/PDF or docx structure (they’re not drop-in for your stack).
- **Open source:** Look for “resume template” repos (e.g. LaTeX, HTML, or React) and port one or two to your PDF/HTML components. Check license (MIT/Apache preferred).

**Use case:** Inspiration or a second “premium” template; implementation still in-house.

### Option C: Template-as-config (later)

- Define templates as **config** (section order, which sections show, title style, spacing) and one “layout engine” that renders PDF/HTML from config. More flexible but more work upfront.

**Recommendation:** Start with **Option A** – 2–3 in-house resume designs + 1–2 cover letter layouts. Add Option B/C later if you want more variety or “premium” templates.

---

## 2. How to get font styles

### PDF (`@react-pdf/renderer`)

- **Built-in:** Helvetica, Times-Roman, Courier (no setup).
- **Custom fonts:** Register with `Font.register()` (local file or URL). Then set `fontFamily` in styles.
  - **Google Fonts:** Download `.ttf` (e.g. from [google-webfonts-helper](https://gwfh.mranftl.com/fonts)) and place in `public/fonts/`. Register from `/fonts/YourFont-Regular.ttf`.
  - **Safe for resume:** Serif (e.g. Lora, Merriweather, Source Serif Pro), sans (e.g. Open Sans, Source Sans 3, Inter). Avoid decorative fonts for ATS.

### Web / public resume (`/r/[slug]`)

- **Tailwind:** Use `font-sans`, `font-serif` or custom `font-*` (define in `tailwind.config`).
- **Google Fonts:** Add `<link href="https://fonts.googleapis.com/css2?family=...">` in layout or use `next/font/google` and map to CSS variables or class names per template.

### DOCX

- **docx** library: `TextRun` / paragraph options support `font`, `size`, etc. Use a small set of font names (e.g. “Calibri”, “Times New Roman”, “Georgia”) so exports look correct in Word.

### Suggested font sets (for a “font picker”)

| Set | Use case | PDF (register) | Web |
|-----|----------|------------------|-----|
| **Classic** | Traditional, ATS-safe | Times-Roman or Times New Roman .ttf | Georgia / serif |
| **Modern** | Default today | Helvetica or Inter .ttf | Inter / sans |
| **Friendly** | Slightly softer | Open Sans or Lora .ttf | Lora / Open Sans |

Start with 2–3 choices; expand later.

---

## 3. What else people like to customize

Beyond **template (layout)** and **font**, users typically expect:

| Customization | Description | Where to store | Priority |
|---------------|-------------|----------------|----------|
| **Accent / heading color** | Color for section titles, name, or line. | `resume_data.theme.accentColor` or `design.accent` | High |
| **Font size** | Base or “compact vs readable”. | `resume_data.design.fontSize` (e.g. "small" \| "medium" \| "large") | Medium |
| **Section order** | e.g. Experience first vs Education first. | `resume_data.design.sectionOrder` or template default | Medium |
| **Show/hide sections** | e.g. hide Summary, show Projects. | `resume_data.design.visibleSections` or template default | Medium |
| **Spacing / density** | Compact (1 page) vs relaxed (2 pages). | Part of template or `resume_data.design.density` | Medium |
| **Margin / page layout** | Narrow vs wide. | Template or `resume_data.design.margins` | Low (Phase 2+) |
| **Cover letter layout** | Same idea: font, accent, spacing. | In generated_documents or user “letter theme” in profile | High when you add CL export |
| **Public page theme** | “Clean” vs “Minimal” (ROADMAP 7.3). | `resume_data.design.publicTheme` or `resume_data.theme` | High |

Store all of this in **`resume_data`** (e.g. `resume_data.design` or `resume_data.theme`) so no DB migration is required. Example:

```ts
// resume_data.design (optional)
{
  templateId: "clean" | "minimal" | "modern",
  fontFamily: "classic" | "modern" | "friendly",
  accentColor: "#2563eb",
  fontSize: "medium",
  sectionOrder: ["summary", "experience", "education", "skills"],
  publicTheme: "clean" | "minimal"
}
```

---

## 4. Phased plan: templates, fonts, and customization

### Phase T1 – Resume design templates + one font choice (foundation)

**Goal:** 2–3 distinct **resume layouts** and one extra font so “template” and “font” are real.

| Task | Description |
|------|-------------|
| **T1.1** | Add `resume_data.design.templateId` (e.g. `"default"`, `"clean"`, `"minimal"`). Default to `"default"` for existing resumes. |
| **T1.2** | Implement 2–3 PDF templates in `src/lib/resume-templates/` (or one file with 2–3 components): e.g. **Default** (current), **Clean** (more whitespace, simple underlines), **Minimal** (smaller headers, very compact). `ResumePDFDocument` picks component from `templateId`. |
| **T1.3** | Add 1–2 extra fonts: register in `resume-pdf` (e.g. Times New Roman + one sans). Add `resume_data.design.fontFamily` (`"default"` \| `"serif"` \| `"sans"`). |
| **T1.4** | Resume editor: dropdown or cards “Resume design” (template + font). Save to `resume_data.design` on change. |
| **T1.5** | Public `/r/[slug]`: read `design.templateId` and `design.publicTheme`; render 2 variants (e.g. “Clean” vs “Minimal”) with different CSS. Implement ROADMAP 7.3. |

**Outcome:** Users pick a resume design and font; PDF and public page respect it.

---

### Phase T2 – Theme color + DOCX + cover letter export

**Goal:** Accent color, DOCX that matches, and cover letter as a real “document” with layout.

| Task | Description |
|------|-------------|
| **T2.1** | Add `resume_data.design.accentColor` (hex). Use in PDF and public page for headings/line. Resume editor: color picker or 3–5 presets. |
| **T2.2** | DOCX export: pass `design` (font, maybe accent) into ExportActions; use `docx` styles so export matches chosen look. |
| **T2.3** | Cover letter: add 1–2 **letter layouts** (HTML + optional PDF). Store “letter theme” in user profile or per document (e.g. formal / modern). |
| **T2.4** | Cover letter export: “Download as PDF” / “Download as DOCX” using letter layout + chosen font/theme. |

**Outcome:** Resumes and cover letters feel branded; both export in line with the chosen design.

---

### Phase T3 – More customization (sections, density, fonts)

**Goal:** Section order, visibility, density, and a few more fonts.

| Task | Description |
|------|-------------|
| **T3.1** | `resume_data.design.sectionOrder` and `visibleSections`. PDF and public page render in that order and hide unchecked sections. |
| **T3.2** | “Density” or “Font size”: compact / standard / relaxed. Adjust spacing and font size in PDF and web. |
| **T3.3** | Font picker: 3–5 options (Classic, Modern, Friendly, etc.) with proper registration for PDF and web. |
| **T3.4** | Resume editor: “Customize design” panel (template, font, color, sections, density) so everything is in one place. |

**Outcome:** Power users can tune layout and density without leaving the app.

---

### Phase T4 – More templates and polish

**Goal:** More template variety and “premium” feel.

| Task | Description |
|------|-------------|
| **T4.1** | Add 1–2 more resume templates (e.g. “Two column”, “Executive” layout). Possibly from Option B (bought/ported). |
| **T4.2** | Cover letter: 2–3 designs (formal block, modern header, minimal) and optional letterhead look. |
| **T4.3** | Template previews: small thumbnail or preview in “Create resume” and “Customize design” so users see the look before choosing. |
| **T4.4** | Optional: “Duplicate resume with new design” so users can keep content and switch template in one click. |

**Outcome:** Rich set of templates and clear previews; resume and cover letter feel like a full “document suite.”

---

## 5. Where things live in code (summary)

| What | Where |
|------|--------|
| Resume PDF templates | `src/lib/resume-templates/` (e.g. `default.tsx`, `clean.tsx`, `minimal.tsx`) or one file with multiple components; `resume-pdf.tsx` imports and selects by `design.templateId`. |
| Font registration (PDF) | `src/lib/resume-pdf.tsx` or `src/lib/resume-pdf-fonts.ts` – `Font.register()` once; styles use `fontFamily`. |
| Public resume themes | `src/app/r/[slug]/` – 2–3 layout/components or CSS variants driven by `resume_data.design.publicTheme` / `templateId`. |
| DOCX styling | `src/app/dashboard/resumes/[id]/export/ExportActions.tsx` – pass `design` and set font/size in `docx` building. |
| Cover letter layout/export | New: `src/lib/cover-letter-pdf.tsx` (or HTML-to-PDF) and optional DOCX in a new export flow; theme from profile or document. |
| Design state | Always in `resume_data.design` (and optionally a shared “user letter theme” in profile for cover letters). |

---

## 6. Suggested order to build

1. **T1.1 + T1.2 + T1.4** – Add `design.templateId`, 2 PDF templates, and editor dropdown.  
2. **T1.3 + T1.5** – Font choice + public page theme (ROADMAP 7.3).  
3. **T2.1 + T2.2** – Accent color + DOCX design.  
4. **T2.3 + T2.4** – Cover letter layouts and export.  
5. **T3** – Sections, density, font picker, “Customize design” panel.  
6. **T4** – More templates, previews, polish.

This gives you a clear path from “one layout” to “multiple templates, fonts, and colors” and then to “full customization + cover letter design,” without blocking the rest of the product.

---

## 7. How this fits the product (FEATURES.md Tier 6)

From **FEATURES.md**: *“Templates and ‘looks’ – Multiple resume layouts (clean, modern, minimal) and optional branding (color, font). Still one click to tailor for a job.”*

| Tier 6 item | This doc |
|--------------|----------|
| Multiple resume layouts | Phase T1 (2–3 designs), T4 (more) |
| Optional branding (color, font) | Phase T2 (accent color), T1/T3 (fonts) |
| One click to tailor | Unchanged; design lives in `resume_data`, so tailor keeps content and can keep or inherit design |
