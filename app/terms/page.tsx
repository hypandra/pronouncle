import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | Pronouncle",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-10">
          <Link href="/" className="text-sm text-muted-foreground hover:text-ink transition-colors">
            ← Back to Pronouncle
          </Link>

          <div className="space-y-3">
            <h1 className="text-3xl font-display text-ink">Terms of Service</h1>
            <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 text-sm text-ink space-y-2">
              <p>This is example content for self-hosted deployments serving external users.</p>
              <p>
                Replace{" "}
                <span className="font-mono bg-ink/10 px-1 rounded">[Your Organization]</span> with your
                entity name and customize for your jurisdiction. This is not legal advice.
              </p>
              <p>
                If you run Pronouncle locally or restrict access to your family, you don&apos;t need
                to customize these terms.
              </p>
              <p>
                Open source project: {" "}
                <a
                  href="https://github.com/hypandra/pronouncle"
                  className="text-ink underline hover:text-ink/80 transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  github.com/hypandra/pronouncle
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <section className="space-y-2">
              <h2 className="text-xl font-display text-ink">About This Service</h2>
              <p className="text-muted-foreground">
                Pronouncle helps users practice pronunciation using text-to-speech and speech
                recognition.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-display text-ink">Data Collection</h2>
              <p className="text-muted-foreground">
                <span className="font-mono bg-ink/10 px-1 rounded">[Your Organization]</span> collects
                email for account purposes and stores pronunciation practice data.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-display text-ink">Audio Processing</h2>
              <p className="text-muted-foreground">
                The app uses speech recognition services to evaluate pronunciation. Audio recordings
                are processed but not permanently stored by{" "}
                <span className="font-mono bg-ink/10 px-1 rounded">[Your Organization]</span>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-display text-ink">No Warranty</h2>
              <p className="text-muted-foreground">
                Provided &quot;as is&quot; without warranties. Not a replacement for professional speech
                therapy.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-display text-ink">Changes to Terms</h2>
              <p className="text-muted-foreground">
                <span className="font-mono bg-ink/10 px-1 rounded">[Your Organization]</span> may
                update these terms.
              </p>
            </section>
          </div>

          <div className="text-sm text-muted-foreground pt-4 border-t border-rule">
            Template version: February 2026
          </div>
        </div>
      </main>
    </div>
  )
}
