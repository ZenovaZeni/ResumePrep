# Interview Tab – Phased Build Plan

The Interview tab currently has a working mock interview coach (Pro-gated) and related APIs. This document maps out phases to fully build out the feature and remove "coming soon" blockers.

---

## Current State

- **InterviewCoach** – Text-based mock interview (behavioral, technical, situational)
- **APIs** – `/api/interview`, `/api/interview/step`, `/api/interview/prep`, `/api/interview/follow-up`
- **ApplicationInterviewPrep** – Role-specific prep and thank-you email from application detail page
- **Gating** – Interview coach is Pro-only; Billing shows "Upgrade to Pro (coming soon)"

---

## Phase 1: Unblock Free Tier (MVP)

**Goal:** Let free users use the interview coach with a usage limit.

| Task | Description |
|------|-------------|
| 1.1 | Add `FREE_INTERVIEW_SESSIONS_PER_MONTH` (e.g. 3) to `lib/tier.ts` |
| 1.2 | Create `interview_usage` table or use `interview_sessions` count to enforce monthly limit |
| 1.3 | Update `canUseFeature("interview")` to allow free tier when under limit |
| 1.4 | Show usage in UI: "2 of 3 free sessions used this month" |
| 1.5 | Pro users: unlimited sessions |

**Deliverable:** Free users can run a limited number of mock interviews per month.

---

## Phase 2: Session History & UX

**Goal:** Better session management and navigation.

| Task | Description |
|------|-------------|
| 2.1 | Session list – click to view past session details (questions, answers, feedback) |
| 2.2 | Persist Q&A and feedback in `interview_sessions.feedback` JSONB |
| 2.3 | Add "Resume session" for in-progress sessions (if we add `status` column) |
| 2.4 | Empty state when no sessions: "Start your first mock interview" |
| 2.5 | Filter sessions by type (behavioral, technical, situational) |

**Deliverable:** Users can browse and review past interview sessions.

---

## Phase 3: Voice Mode (Optional)

**Goal:** Speech input and AI voice output.

| Task | Description |
|------|-------------|
| 3.1 | Whisper API – record and transcribe user answers |
| 3.2 | ElevenLabs (or similar) – AI reads questions aloud |
| 3.3 | Toggle: "Text mode" vs "Voice mode" in InterviewCoach |
| 3.4 | Env vars: `OPENAI_WHISPER_API_KEY`, `ELEVENLABS_API_KEY` |

**Deliverable:** Optional voice-based mock interviews.

---

## Phase 4: Application-Linked Prep

**Goal:** Tie interview prep to specific job applications.

| Task | Description |
|------|-------------|
| 4.1 | From application detail → "Prep for this interview" pre-fills role/company |
| 4.2 | Store `application_id` on `interview_sessions` (nullable FK) |
| 4.3 | Show "Prep for [Company] – [Role]" in session list when linked |
| 4.4 | ApplicationInterviewPrep already exists; ensure it routes to InterviewCoach with context |

**Deliverable:** Interview prep is contextual to the job being applied for.

---

## Phase 5: Billing & Pro Unlock

**Goal:** Remove "coming soon" and enable Pro upgrades.

| Task | Description |
|------|-------------|
| 5.1 | Integrate Stripe (or chosen provider) for Pro subscriptions |
| 5.2 | Webhook to set `profiles.tier = 'pro'` on successful payment |
| 5.3 | Replace disabled "Upgrade to Pro (coming soon)" with real checkout |
| 5.4 | Pro benefits: unlimited interviews, more cover letters, etc. |

**Deliverable:** Users can upgrade to Pro and unlock full interview access.

---

## Phase 6: Polish & Analytics (Later)

| Task | Description |
|------|-------------|
| 6.1 | Session summary – overall feedback, suggested improvements |
| 6.2 | Export session as PDF for review |
| 6.3 | STAR method tips / structured answer guidance |
| 6.4 | Analytics: sessions per week, most practiced types |

---

## Suggested Order

1. **Phase 1** – Unblock free users (highest impact, low effort)
2. **Phase 2** – Session history (improves retention)
3. **Phase 4** – Application-linked prep (leverages existing ApplicationInterviewPrep)
4. **Phase 5** – Billing (removes "coming soon")
5. **Phase 3** – Voice mode (optional enhancement)
6. **Phase 6** – Polish (as needed)

---

## Quick Win: Remove "Coming Soon" Copy

If you want to reduce "coming soon" friction before full billing:

- In `BillingSection.tsx`: change "Upgrade to Pro (coming soon)" to "Upgrade to Pro" and keep the button disabled, or add a "Join waitlist" / "Notify me" action.
- In `tier.ts`: consider temporarily allowing `interview` for free tier (Phase 1) so the feature is usable while billing is built.
