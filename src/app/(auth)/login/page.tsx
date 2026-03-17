"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthToast } from "@/components/AuthToast";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseConfigured();
  const supabase = configured ? createClient() : null;

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "session") {
      setToast({
        message: "Please sign in to continue to your dashboard.",
        kind: "info",
      });
    }
  }, [searchParams]);

  const showToast = useCallback((message: string, kind: "success" | "error") => {
    setToast({ message, kind });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setStatus("Signing in…");
    setToast(null);
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setStatus("");
        setLoading(false);
        showToast(signInError.message, "error");
        return;
      }
      if (!data.session) {
        setStatus("");
        setLoading(false);
        showToast("No session returned. Check Supabase Auth settings (e.g. disable “Confirm email”).", "error");
        return;
      }
      setStatus("Success! Redirecting…");
      showToast("Signed in. Taking you to the dashboard.", "success");
      // Wait for session to be written to cookies then redirect (session is already set by signInWithPassword)
      const redirect = () => {
        fetch("/api/auth/session", { credentials: "include" })
          .finally(() => { window.location.href = "/dashboard"; });
      };
      setTimeout(redirect, 400);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus("");
      setLoading(false);
      showToast(message, "error");
    }
  }

  const isDev = typeof window !== "undefined" && process.env.NODE_ENV === "development";
  const TEST_EMAIL = "test@example.com";
  const TEST_PASSWORD = "TestPassword123!";

  async function handleTestAccount() {
    if (!supabase) return;
    setStatus("Creating test account or signing in…");
    setToast(null);
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: { first_name: "Test", last_name: "User" },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
        },
      });
      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.message.includes("already exists")) {
          setStatus("Signing in…");
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
          });
          if (signInError) {
            setStatus("");
            setLoading(false);
            showToast(signInError.message, "error");
            return;
          }
          if (signInData?.session) {
            setStatus("Success! Redirecting…");
            showToast("Signed in. Taking you to the dashboard.", "success");
            setTimeout(() => {
              fetch("/api/auth/session", { credentials: "include" }).finally(() => { window.location.href = "/dashboard"; });
            }, 400);
            return;
          }
        } else {
          setStatus("");
          setLoading(false);
          showToast(signUpError.message, "error");
          return;
        }
      }
      if (signUpData.session) {
        setStatus("Success! Redirecting…");
        showToast("Signed in. Taking you to the dashboard.", "success");
        setTimeout(() => {
          fetch("/api/auth/session", { credentials: "include" }).finally(() => { window.location.href = "/dashboard"; });
        }, 400);
        return;
      }
      if (signUpData.user && !signUpData.session) {
        // Email confirmation may be required; try signing in anyway (works when confirmation is disabled)
        setStatus("Signing in…");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });
        if (!signInError && signInData?.session) {
          setStatus("Success! Redirecting…");
          showToast("Signed in. Taking you to the dashboard.", "success");
          setTimeout(() => {
            fetch("/api/auth/session", { credentials: "include" }).finally(() => { window.location.href = "/dashboard"; });
          }, 400);
          return;
        }
        setStatus("");
        setLoading(false);
        showToast("Account created. Turn off “Confirm email” in Supabase Dashboard → Authentication → Providers → Email, then try again.", "error");
        return;
      }
      setStatus("Success! Redirecting…");
      showToast("Signed in. Taking you to the dashboard.", "success");
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
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-primary)] gradient-mesh">
      {toast && (
        <AuthToast
          message={toast.message}
          kind={toast.kind}
          onDismiss={() => setToast(null)}
        />
      )}
      <div className="w-full max-w-[400px] rounded-[var(--radius-xl)] glass p-6 sm:p-8 shadow-2xl">
        <Link href="/" className="inline-block text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-6">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Sign in to continue to your dashboard.
        </p>

        {!configured && (
          <div className="mb-6 p-4 rounded-[var(--radius-md)] bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
            <p className="font-medium mb-1">Supabase not configured</p>
            <p>Add <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code className="bg-black/30 px-1 rounded">.env.local</code>, then stop the dev server (Ctrl+C) and run <code className="bg-black/30 px-1 rounded">npx next dev</code> again.</p>
          </div>
        )}

        {configured && (
          <p className="mb-4 text-xs text-[var(--text-tertiary)]">
            Ensure Supabase Auth has email provider enabled and, for instant sign-in without confirmation, turn off “Confirm email” in Dashboard → Authentication → Providers → Email.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
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
            {loading ? "Signing in…" : "Sign in"}
          </button>

          {isDev && configured && (
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-tertiary)] mb-2">Dev: one-click test account (test@example.com / TestPassword123!)</p>
              <button
                type="button"
                onClick={handleTestAccount}
                disabled={loading}
                className="w-full py-2.5 text-sm rounded-[var(--radius-md)] bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50"
              >
                {loading ? "…" : "Use test account (create or sign in)"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const r = await fetch("/api/auth/test-account", { method: "POST" });
                    const j = await r.json();
                    if (j.created) showToast("Test user created. Click the button above to sign in.", "success");
                    else if (j.message) showToast(j.message, "success");
                    else showToast(j.error || j.hint || JSON.stringify(j), "error");
                  } catch (e) {
                    showToast(e instanceof Error ? e.message : String(e), "error");
                  }
                }}
                disabled={loading}
                className="mt-2 w-full py-2 text-xs rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-glass)] disabled:opacity-50"
              >
                Create test user via API (needs SUPABASE_SERVICE_ROLE_KEY)
              </button>
            </div>
          )}
        </form>
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
