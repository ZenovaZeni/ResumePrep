"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status =
  | "saved"
  | "applied"
  | "interview"
  | "final_interview"
  | "rejected"
  | "offer";

interface ApplicationFormProps {
  initial?: {
    id: string;
    company_name: string;
    job_title: string;
    job_description: string | null;
    job_url: string | null;
    date_applied: string | null;
    status: Status;
    notes: string | null;
  };
}

export function ApplicationForm({ initial }: ApplicationFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: initial?.company_name ?? "",
    job_title: initial?.job_title ?? "",
    job_description: initial?.job_description ?? "",
    job_url: initial?.job_url ?? "",
    date_applied: initial?.date_applied ?? "",
    status: (initial?.status ?? "saved") as Status,
    notes: initial?.notes ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = initial
      ? `/api/applications/${initial.id}`
      : "/api/applications";
    const method = initial ? "PATCH" : "POST";
    const body = initial
      ? { ...form, date_applied: form.date_applied || null }
      : {
          company_name: form.company_name,
          job_title: form.job_title,
          job_description: form.job_description || null,
          job_url: form.job_url || null,
          date_applied: form.date_applied || null,
          status: form.status,
          notes: form.notes || null,
        };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/dashboard/applications");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Company</label>
        <input
          type="text"
          value={form.company_name}
          onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
          required
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Job title</label>
        <input
          type="text"
          value={form.job_title}
          onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
          required
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Job description (paste for ATS & tailoring)</label>
        <textarea
          rows={6}
          value={form.job_description}
          onChange={(e) => setForm((f) => ({ ...f, job_description: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Job URL</label>
        <input
          type="url"
          value={form.job_url}
          onChange={(e) => setForm((f) => ({ ...f, job_url: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Date applied</label>
        <input
          type="date"
          value={form.date_applied}
          onChange={(e) => setForm((f) => ({ ...f, date_applied: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
        >
          <option value="saved">Saved</option>
          <option value="applied">Applied</option>
          <option value="interview">Interview</option>
          <option value="final_interview">Final Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Notes</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
      >
        {saving ? "Saving…" : initial ? "Update" : "Add application"}
      </button>
    </form>
  );
}
