"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords don’t match." });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({ type: "ok", text: "Password updated. Use it next time you sign in." });
      setPassword("");
      setConfirm("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          minLength={6}
          autoComplete="new-password"
          className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Same as above"
          minLength={6}
          autoComplete="new-password"
          className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>
      {message && (
        <p
          className={`text-sm ${message.type === "ok" ? "text-emerald-400" : "text-red-400"}`}
          role="alert"
        >
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
