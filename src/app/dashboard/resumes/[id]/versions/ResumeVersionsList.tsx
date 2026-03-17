"use client";

import { useState } from "react";
import Link from "next/link";

interface Variant {
  id: string;
  name: string;
  created_at: string;
}

interface ResumeVersionsListProps {
  resumeId: string;
  resumeName: string;
  variants: Variant[];
}

export function ResumeVersionsList({
  resumeId,
  resumeName,
  variants,
}: ResumeVersionsListProps) {
  const [cloning, setCloning] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleClone() {
    if (!newName.trim()) return;
    setCloning(true);
    try {
      const res = await fetch("/api/resumes/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: resumeId, name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        window.location.href = `/dashboard/resumes/${data.id}`;
      }
    } finally {
      setCloning(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
        <h2 className="text-lg font-medium text-white mb-3">Clone resume</h2>
        <p className="text-zinc-400 text-sm mb-4">
          Create a new resume with the same content so you can maintain multiple versions (e.g. “Startup”, “Corporate”).
        </p>
        <div className="flex gap-3 flex-wrap items-center">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New resume name"
            className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          />
          <button
            type="button"
            onClick={handleClone}
            disabled={cloning || !newName.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
          >
            {cloning ? "Cloning…" : "Clone"}
          </button>
        </div>
      </section>

      <section className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
        <h2 className="text-lg font-medium text-white mb-3">Job-specific variants</h2>
        <p className="text-zinc-400 text-sm mb-4">
          These are tailored versions created from the “Tailor resume” action on an application.
        </p>
        {variants.length > 0 ? (
          <ul className="space-y-2">
            {variants.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
              >
                <span className="text-white">{v.name}</span>
                <span className="text-zinc-500 text-sm">
                  {new Date(v.created_at).toLocaleDateString()}
                </span>
                <Link
                  href={`/dashboard/resumes/compare?base=${resumeId}&variant=${v.id}`}
                  className="text-indigo-400 hover:underline text-sm"
                >
                  Compare
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-500 text-sm">No variants yet. Tailor this resume from an application to create one.</p>
        )}
      </section>
    </div>
  );
}
