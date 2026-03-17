import { ApplicationForm } from "../ApplicationForm";

export default function NewApplicationPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">Add application</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Track a job and use AI to tailor your resume and generate a cover letter.</p>
      <ApplicationForm />
    </div>
  );
}
