import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">Smart Resume</span>
          <nav className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              How it works
            </a>
            <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Features
            </a>
            <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="btn-primary"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden gradient-mesh">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,var(--bg-primary)_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-[var(--accent)] tracking-wide uppercase mb-4">
            Your AI career assistant
          </p>
          <h1 className="text-[var(--text-hero)] md:text-[var(--text-display)] font-semibold tracking-tight leading-[var(--leading-tight)] mb-6">
            Land more interviews.
            <br />
            <span className="text-[var(--text-secondary)]">Not just more applications.</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-snug mb-10">
            One platform to build ATS-friendly resumes, tailor them to every job, practice interviews, and track your pipeline—so you get to the offer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary w-full sm:w-auto min-w-[200px] py-4 text-base">
              Start free — no credit card
            </Link>
            <a href="#how-it-works" className="btn-secondary w-full sm:w-auto min-w-[200px] py-4 text-base">
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-[var(--space-section)] px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-[var(--accent)] tracking-wide uppercase mb-3">
            The problem
          </p>
          <h2 className="text-[var(--text-h1)] font-semibold tracking-tight mb-12 max-w-2xl">
            Job hunting is broken. You send hundreds of applications and hear nothing back.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Resumes get rejected by bots",
                body: "ATS systems filter out great candidates because of formatting or missing keywords. Yours might never reach a human.",
              },
              {
                title: "One resume doesn't fit every job",
                body: "Generic applications get ignored. Recruiters want to see that you've tailored your experience to their role.",
              },
              {
                title: "Interviews feel like a black box",
                body: "You don't know how you'll perform until you're in the room. Most people wing it—and underperform.",
              },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-[var(--radius-lg)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-snug">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-[var(--space-section)] px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-medium text-[var(--accent)] tracking-wide uppercase mb-3">
            How it works
          </p>
          <h2 className="text-[var(--text-h1)] font-semibold tracking-tight mb-4">
            Your entire hiring funnel, in one place
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-16">
            From first draft to final offer—we guide you step by step with AI that actually understands the job market.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { step: "01", title: "Build your profile", desc: "One source of truth: experience, skills, wins. We turn it into polished, ATS-friendly resumes." },
              { step: "02", title: "Score & tailor", desc: "Paste any job description. Get an ATS score and a tailored resume and cover letter in one click." },
              { step: "03", title: "Track & apply", desc: "Keep every application in one dashboard. Never lose track of who you've contacted or where you stand." },
              { step: "04", title: "Prepare to win", desc: "Practice behavioral and technical interviews with AI feedback before the real thing." },
            ].map((item) => (
              <div key={item.step} className="p-6 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-tertiary)] text-sm font-mono">{item.step}</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-[var(--space-section)] px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-[var(--accent)] tracking-wide uppercase mb-3">
            Features
          </p>
          <h2 className="text-[var(--text-h1)] font-semibold tracking-tight mb-12">
            Everything you need to get hired
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "AI Resume Builder", desc: "Professional resumes from your profile. Multiple templates, one click." },
              { title: "ATS Score & Feedback", desc: "See how your resume ranks. Get specific fixes for keywords and format." },
              { title: "Job-Specific Tailoring", desc: "Paste a job description. Get a rewritten resume that matches the role." },
              { title: "Cover Letter Generator", desc: "Personalized letters for every application. No more blank-page syndrome." },
              { title: "Application Tracker", desc: "Pipeline view: saved, applied, interview, offer. Stay organized." },
              { title: "Mock Interview Coach", desc: "Behavioral and technical practice with AI feedback before the real call." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                <div className="shrink-0 w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--accent-muted)] flex items-center justify-center text-[var(--accent)] font-semibold text-sm">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[var(--space-section)] px-6">
        <div className="max-w-3xl mx-auto text-center gradient-mesh rounded-[var(--radius-xl)] p-12 md:p-16 border border-[var(--border-subtle)]">
          <h2 className="text-[var(--text-h2)] md:text-[var(--text-h1)] font-semibold tracking-tight mb-4">
            Ready to get more interviews?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Join the platform that turns your experience into offers. Free to start.
          </p>
          <Link href="/signup" className="btn-primary inline-flex min-w-[220px] py-4 text-base">
            Create your account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-[var(--text-tertiary)]">Smart Resume Platform</span>
          <div className="flex gap-6">
            <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Log in
            </Link>
            <Link href="/signup" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
