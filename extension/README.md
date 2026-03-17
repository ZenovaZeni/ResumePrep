# Apply with AI – Browser Extension (Phase 4.3)

This folder is the scaffold for a future browser extension that lets users:

- Generate tailored resumes from the current job board page
- Generate cover letters
- Track applications with `source: "extension"`

## Architecture

- **Extension**: Injects into job board pages (e.g. LinkedIn, Indeed), captures job title, company, and description, and sends them to the Smart Resume Platform API.
- **Auth**: User signs in via Supabase (e.g. popup or redirect); extension stores a short-lived token and sends it with API requests.
- **API**: Use existing Next.js API routes; ensure CORS allows the extension origin. Applications created from the extension should set `source: "extension"`.

## Suggested stack

- Manifest V3
- React or vanilla JS for popup/side panel
- Supabase Auth for login (same project as web app)
- Fetch to `NEXT_PUBLIC_SITE_URL/api/...` with Authorization header

## Next steps

1. Create `manifest.json` and popup UI.
2. Content script: detect job detail page, extract job description and company.
3. Call `/api/resumes/tailor`, `/api/cover-letter/generate`, `/api/applications` with the extracted data.
4. Optional: one-click “Save to Smart Resume” that creates an application and opens the dashboard.
