# Smart Resume Platform – Roadmap: Truly Amazing & AI-Integrated

Breakdown of features, pages, and functions to add or refine. Grouped by area with priorities.

---

## 1. Design consistency (quick wins)

Unify all dashboard pages with the app’s design tokens so the whole product feels one system.

| Task | Description |
|------|-------------|
| **1.1** Applications list | Replace `zinc`/`indigo` with `var(--text-primary)`, `var(--bg-elevated)`, `var(--accent)` (like Resumes page). |
| **1.2** Profile page | Same token pass for heading, description, and form container. |
| **1.3** Career page | Tokens for heading, description, CareerAdvisor container, recent suggestions cards. |
| **1.4** Interview page | Tokens for heading, tier gate box, sessions list. |
| **1.5** Resume edit page | Tokens for title and subtitle; ensure ResumeEditor uses tokens where it can. |
| **1.6** Application detail & forms | Application detail view, new/edit forms: tokens and `btn-primary` where appropriate. |

---

## 2. AI visibility & in-context actions

Make AI features obvious and easy to use where you’re already working.

| Task | Description |
|------|-------------|
| **2.1** Resume editor – Suggest bullets | Add “Suggest bullets” (or “AI suggest”) next to each role; call existing `suggestBullets()` and let user pick to insert. |
| **2.2** Resume editor – ATS in flow | “Run ATS check” in editor with optional job description paste; show score + feedback in a panel or modal. |
| **2.3** Resume editor – Tailor from job | “Tailor to job” button: paste job description (or pick from applications); call tailor API; offer “Save as new version” or variant. |
| **2.4** Application detail – AI actions | On application detail page: “Tailor a resume to this job” (pick resume → tailor → save variant) and “Generate cover letter” (show + copy / download). |
| **2.5** Cover letter usage (free tier) | Persist monthly count (e.g. in DB or profile); show “X/3 cover letters this month” and “Upgrade for more” when at limit. |
| **2.6** Career advisor – target role | Add optional “Target role” input; pass to existing `getCareerSuggestions(profile, targetRole)` and show results in same UI. |

---

## 3. Voice & interview (AI + UX)

Use existing voice utilities to make the interview coach more immersive.

| Task | Description |
|------|-------------|
| **3.1** Interview – voice answer | In Interview Coach: “Answer by voice” → record (MediaRecorder) → send to `transcribeAudio()` → use text as answer for next step. |
| **3.2** Interview – TTS for questions | Optional “Read question aloud” using `textToSpeech()` (ElevenLabs) so users can practice listening. |
| **3.3** Interview – session summary | At end of session, one AI call to summarize “What went well / what to improve”; show on session detail or in recent sessions. |

---

## 4. Pro tier & upgrade path

Make the free/pro boundary clear and actionable.

| Task | Description |
|------|-------------|
| **4.1** Enforce cover letter limit | Check monthly count before calling cover letter API; return 402 or specific error and show upgrade CTA in UI. |
| **4.2** Settings / Billing page | New page: show current tier (Free / Pro), “Upgrade to Pro” (Stripe or placeholder), link to “Manage subscription” if applicable. |
| **4.3** Upgrade CTAs | In nav or dashboard: subtle “Upgrade to Pro” for free users; when hitting interview gate or cover letter limit, show modal or inline CTA. |

---

## 5. Onboarding & empty states

Guide new users so they reach value fast.

| Task | Description |
|------|-------------|
| **5.1** Post-signup flow | After first login, redirect or banner: “Complete your profile to generate resumes” with link to profile. |
| **5.2** Profile completion hint | On dashboard or profile: simple progress (e.g. “Profile 60% complete” from required fields) and “Finish profile” CTA. |
| **5.3** Empty states | Consistent empty-state pattern: icon + short copy + primary CTA (e.g. Applications: “Track your first application”, Resumes: already done). |

---

## 6. Settings & account

Trust and control.

| Task | Description |
|------|-------------|
| **6.1** Settings page shell | New `/dashboard/settings`: sections Account, Security, Billing (or placeholder). |
| **6.2** Account section | Show email (read-only), optional “Change email” (Supabase flow) if desired. |
| **6.3** Change password | “Change password” using Supabase `updateUser` or auth flow; success/error toast. |
| **6.4** Danger zone | “Delete my account” with confirmation; call Supabase auth + delete profile/cascade or soft-delete. |

---

## 7. Public resume polish

Make `/r/[slug]` share-ready and professional.

| Task | Description |
|------|-------------|
| **7.1** Print styles | Print-specific CSS: hide nav/buttons, good margins, break-ins for sections. |
| **7.2** Copy link & share | “Copy link” and optional “Share” (Web Share API if available); show short slug URL. |
| **7.3** Theme option | Allow resume owner to pick “Clean” vs “Minimal” (or one alternate) and store in `resume_data` or resume row; render in public page. |

---

## 8. Resume builder & public link in editor

Small UX improvements in the resume flow.

| Task | Description |
|------|-------------|
| **8.1** Public link in editor | In resume edit: show “Public link” (if slug set) with copy button; “Generate link” if no slug (call slug API + save). |
| **8.2** Slug in list | On resumes list, show “Copy link” or link icon for resumes that have a slug. |

---

## 9. Extension (browser)

Turn the scaffold into a minimal useful flow.

| Task | Description |
|------|-------------|
| **9.1** Popup – save job | Popup: field for “Job URL” or “Paste job description”; “Save to Smart Resume” → open app with prefill (e.g. `/dashboard/applications/new?url=...`) or create via API with auth. |
| **9.2** Popup – quick actions | “Generate cover letter” or “Tailor resume” from pasted job text: open app to the right page with job pre-filled. |
| **9.3** Content script (optional) | On job board pages: “Save to Smart Resume” button that injects into the page and sends job title/company/description to app. |

---

## 10. Analytics & dashboard depth

Make the dashboard feel alive.

| Task | Description |
|------|-------------|
| **10.1** Dashboard stats | Cards or line: “Applications this month”, “Resumes updated”, “Cover letters generated” (if we persist counts). |
| **10.2** Recent activity | “Recent activity” list: last resume edit, last application added, last ATS run (if we log these). |
| **10.3** Career card on dashboard | “Suggested next step” from latest career suggestion (one sentence + link to Career). |

---

## 11. Error handling & polish

Robust and clear when things fail.

| Task | Description |
|------|-------------|
| **11.1** API error toasts | All AI and auth API errors surface as toasts or inline message (e.g. “OpenAI API error – check OPENAI_API_KEY”). |
| **11.2** Loading states | Skeletons or spinners for: dashboard cards, resume list, applications table, career suggestions. |
| **11.3** 404 & error boundaries | Nice 404 for unknown resume/application IDs; error boundary for dashboard layout so one broken component doesn’t blank the app. |

---

## 12. Mobile & responsive

Works on small screens.

| Task | Description |
|------|-------------|
| **12.1** Applications table → cards | On narrow viewport, switch table to card list (company, role, status, View link). |
| **12.2** Dashboard nav | Collapsible or drawer nav on mobile so all links are reachable. |
| **12.3** Forms & editor | Profile form, application form, resume editor: readable and tappable on mobile (inputs, buttons). |

---

## Suggested order to build (refined)

**Phase A – Polish & consistency (1–2 sessions)**  
1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 (design tokens across dashboard).  
Then 11.1 + 11.2 (errors + loading) so the app feels solid.

**Phase B – AI in context (high impact)**  
2.1 (Suggest bullets) → 2.2 (ATS in editor) → 2.4 (Application detail: tailor + cover letter) → 2.5 (cover letter limit).

**Phase C – Account & upgrade**  
6.1 → 6.2 → 6.3 (Settings + account + password) → 4.1 (enforce limit) → 4.2 (Billing page).

**Phase D – Onboarding & public resume**  
5.1 → 5.2 → 7.1 → 7.2 (onboarding + public resume print + share).

**Phase E – Voice & extension**  
3.1 (voice in interview) → 9.1 (extension save job).

---

## Build status (updated)

- **Phase A:** Design tokens done. Loading skeletons added (dashboard, resumes, applications, profile, settings). Dashboard error boundary added.
- **Phase B:** 2.1, 2.2, 2.4, 2.6 done. 2.5 (cover letter limit) not yet implemented.
- **Phase C:** 6.1, 6.2, 6.3, 4.2 (Billing placeholder) done. 4.1 (enforce limit) not yet.
- **Phase D:** 5.1, 5.2 (onboarding banner + profile-complete check), 7.1 (print: hide toolbar), 7.2 (Copy link on public resume) done.
- **Phase E:** Not started.
