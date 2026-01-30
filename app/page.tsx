import Link from "next/link"
import { PronounclePronunciationCard } from "@/components/pronouncle-pronunciation-card"
import { MiniDemoCard } from "@/components/mini-demo-card"
import {
  LandingHeaderAuth,
  LandingHeroCta,
  LandingHeroSubtext,
  LandingFooterCta,
} from "@/components/landing-auth-cta"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(0_56%_46%_/_0.08),_transparent_55%)]" />
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-success-green/10 blur-3xl" />
        <div className="relative">
          <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                Pronouncle
              </span>
              <span className="text-xs text-muted-foreground">/ prə-ˈnaʊn-səl /</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#how" className="hover:text-ink transition-colors">
                How it works
              </Link>
              <Link href="#demo" className="hover:text-ink transition-colors">
                Demo
              </Link>
              <Link href="#faq" className="hover:text-ink transition-colors">
                FAQ
              </Link>
            </nav>
            <LandingHeaderAuth />
          </header>

          <main className="max-w-6xl mx-auto px-6 pb-16">
            <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-muted-foreground border border-rule px-3 py-2">
                  Dictionary-first pronunciation practice
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold leading-tight">
                  Pronounce the word.
                  <span className="block text-accent-red">Keep the spelling honest.</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Pronouncle turns pronunciation into a daily puzzle. Hear a word, speak it
                  aloud, and watch your score adapt with every attempt.
                </p>
                <LandingHeroCta />
                <LandingHeroSubtext />
              </div>
              <MiniDemoCard />
            </section>

            <section id="demo" className="mt-20 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] items-center">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Demo</p>
                <h2 className="text-3xl font-display text-ink">
                  Try the flow without creating an account.
                </h2>
                <p className="text-muted-foreground">
                  The demo keeps the full Pronouncle feel for five words, but never saves
                  progress. Once you log in, every attempt updates your score and history.
                </p>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center h-11 px-5 bg-accent-red text-white text-sm font-semibold hover:bg-accent-red/90 transition-colors"
                >
                  Launch the 5-word demo
                </Link>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    title: "Pick a word list",
                    copy: "Browse categories or let Pronouncle pick the next challenge.",
                  },
                  {
                    title: "Speak the sentence",
                    copy: "Read aloud, then hear the word back to lock it in.",
                  },
                  {
                    title: "Watch your score",
                    copy: "Adaptive scoring tightens the loop with every attempt.",
                  },
                ].map((item) => (
                  <div key={item.title} className="border border-rule bg-card px-5 py-4 shadow-soft">
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.copy}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="how" className="mt-20">
              <div className="flex items-center justify-between border-b border-rule pb-4">
                <h2 className="text-3xl font-display text-ink">How Pronouncle works</h2>
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  3 steps
                </span>
              </div>
              <div className="grid gap-6 md:grid-cols-3 mt-8">
                {[
                  {
                    title: "See the word",
                    copy: "Each card ties pronunciation hints to its written form.",
                  },
                  {
                    title: "Speak the sentence",
                    copy: "Say the word inside a sentence so rhythm and stress count.",
                  },
                  {
                    title: "Get feedback",
                    copy: "AI checks your spoken sentence while the score adapts to keep you improving.",
                  },
                ].map((item, index) => (
                  <div key={item.title} className="border border-rule bg-card p-6 shadow-soft">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      0{index + 1}
                    </p>
                    <h3 className="text-xl font-display text-ink mt-3">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{item.copy}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="faq" className="mt-20 border-t border-rule pt-12">
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <h2 className="text-3xl font-display text-ink">Good questions.</h2>
                  <p className="text-muted-foreground mt-3">
                    Pronouncle keeps the dictionary vibe while building habit-forming practice.
                  </p>
                </div>
                <div className="space-y-6">
                  <PronounclePronunciationCard />
                  {[
                    {
                      question: "Do I need to log in?",
                      answer: "You can demo anonymously, but saving score and history requires a login.",
                    },
                    {
                      question: "What happens to my score?",
                      answer: "Logged-in practice updates your Elo ranking and unlocks adaptive word picks.",
                    },
                    {
                      question: "Can I practice on mobile?",
                      answer: "Yes. The layout is optimized for quick voice sessions on mobile.",
                    },
                  ].map((item) => (
                    <div key={item.question} className="border-b border-rule pb-4">
                      <p className="text-sm font-semibold text-ink">{item.question}</p>
                      <p className="text-sm text-muted-foreground mt-2">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <LandingFooterCta />
          </main>
        </div>
      </div>
    </div>
  )
}
