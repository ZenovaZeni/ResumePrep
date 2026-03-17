"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthToast } from "@/components/AuthToast";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseConfigured();
  const supabase = configured ? createClient() : null;

  const showToast = useCallback((message: string, kind: "success" | "error") => {
    setToast({ message, kind });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setStatus("Creating account…");
    setToast(null);
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim() || undefined,
          },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
        },
      });
      if (signUpError) {
        setStatus("");
        setLoading(false);
        showToast(signUpError.message, "error");
        return;
      }
      if (data.session) {
        setStatus("Account created! Redirecting…");
        showToast("Account created. Taking you to the dashboard.", "success");
        setTimeout(() => {
          fetch("/api/auth/session", { credentials: "include" }).finally(() => { window.location.href = "/dashboard"; });
        }, 400);
        return;
      }
      if (data.user && !data.session) {
        // When "Confirm email" is off, Supabase may still return no session; try signing in once
        setStatus("Signing you in…");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (!signInError && signInData?.session) {
          setStatus("Account created! Redirecting…");
          showToast("Account created. Taking you to the dashboard.", "success");
          setTimeout(() => {
            fetch("/api/auth/session", { credentials: "include" }).finally(() => { window.location.href = "/dashboard"; });
          }, 400);
          return;
        }
        setStatus("");
        setLoading(false);
        showToast("Account created. Check your email to confirm, then sign in on the login page.", "success");
        return;
      }
      setStatus("Account created! Redirecting…");
      showToast("Account created. Taking you to the dashboard.", "success");
      setTimeout(() => {
        fetch("/api/auth/session", { credentials: "include" }).finally(() => { window.location.href = "/dashboard"; });
      }, 400);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus("");
      setLoading(false);
      showToast(message, "error");
    }
  }

  return (
    <main className="min-h-screen flex items-start sm:items-center justify-center p-4 sm:p-6 bg-[var(--bg-primary)] gradient-mesh">
      {toast && (
        <AuthToast
          message={toast.message}
          kind={toast.kind}
          onDismiss={() => setToast(null)}
        />
      )}
      <div className="w-full max-w-[400px] rounded-[var(--radius-xl)] glass p-6 sm:p-8 shadow-2xl my-4 sm:my-0">
        <Link href="/" className="inline-block text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-6">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-1">
          Create your account
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Start building resumes that get interviews.
        </p>

        {!configured && (
          <div className="mb-6 p-4 rounded-[var(--radius-md)] bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
            <p className="font-medium mb-1">Supabase not configured</p>
            <p>Add <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code className="bg-black/30 px-1 rounded">.env.local</code>, then stop the dev server (Ctrl+C) and run <code className="bg-black/30 px-1 rounded">npx next dev</code> again.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Jane"
              className="w-full px-4 py-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Last name <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
            </label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full px-4 py-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow"
            />
          </div>

          {status && (
            <p className="text-sm text-[var(--text-secondary)] py-1" role="status">
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !configured}
            className="btn-primary w-full py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
