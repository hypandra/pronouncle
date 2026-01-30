"use client"

import Link from "next/link"
import { useSession } from "@/lib/auth-client"

export function LandingHeaderAuth() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <div className="w-20 h-10" /> // Placeholder to prevent layout shift
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/words"
          className="inline-flex items-center justify-center h-10 px-4 bg-success-green text-white text-sm font-semibold hover:bg-success-green/90 transition-colors"
        >
          Go to Words
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/signin"
        className="text-sm text-muted-foreground hover:text-ink transition-colors"
      >
        Sign in
      </Link>
      <Link
        href="/demo"
        className="inline-flex items-center justify-center h-10 px-4 bg-accent-red text-white text-sm font-semibold hover:bg-accent-red/90 transition-colors"
      >
        Try the 5-word demo
      </Link>
    </div>
  )
}

export function LandingHeroCta() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-12 w-48 bg-muted/30 animate-pulse" />
        <div className="h-12 w-48 bg-muted/30 animate-pulse" />
      </div>
    )
  }

  if (session?.user) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/words"
          className="inline-flex items-center justify-center h-12 px-6 bg-success-green text-white font-semibold hover:bg-success-green/90 transition-colors"
        >
          Continue practicing
        </Link>
        <Link
          href="/demo"
          className="inline-flex items-center justify-center h-12 px-6 border border-rule text-ink font-semibold hover:bg-muted/60 transition-colors"
        >
          Try the demo
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Link
        href="/demo"
        className="inline-flex items-center justify-center h-12 px-6 bg-success-green text-white font-semibold hover:bg-success-green/90 transition-colors"
      >
        Start the 5-word demo
      </Link>
      <Link
        href="/signin"
        className="inline-flex items-center justify-center h-12 px-6 border border-rule text-ink font-semibold hover:bg-muted/60 transition-colors"
      >
        Log in to save progress
      </Link>
    </div>
  )
}

export function LandingHeroSubtext() {
  const { data: session } = useSession()

  if (session?.user) {
    return (
      <p className="text-xs text-muted-foreground">
        Your progress syncs automatically. Keep your streak going.
      </p>
    )
  }

  return (
    <p className="text-xs text-muted-foreground">
      Demo mode is five words and never saves progress. Sign in to sync your history and score.
    </p>
  )
}

export function LandingFooterCta() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return null
  }

  if (session?.user) {
    return (
      <section className="mt-16 mb-10 border border-rule bg-card p-8 shadow-soft-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-display text-ink">
            Ready to keep practicing?
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Your progress and scores are automatically synced.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/words"
            className="inline-flex items-center justify-center h-11 px-6 bg-success-green text-white text-sm font-semibold hover:bg-success-green/90 transition-colors"
          >
            Go to Words
          </Link>
          <Link
            href="/progress"
            className="inline-flex items-center justify-center h-11 px-6 border border-rule text-ink text-sm font-semibold hover:bg-muted/60 transition-colors"
          >
            View Progress
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-16 mb-10 border border-rule bg-card p-8 shadow-soft-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div>
        <h2 className="text-2xl font-display text-ink">
          Ready to keep score on pronunciation?
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Sign in to save your streaks, stats, and adaptive word lists.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/signin"
          className="inline-flex items-center justify-center h-11 px-6 bg-success-green text-white text-sm font-semibold hover:bg-success-green/90 transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/demo"
          className="inline-flex items-center justify-center h-11 px-6 border border-rule text-ink text-sm font-semibold hover:bg-muted/60 transition-colors"
        >
          Keep demoing
        </Link>
      </div>
    </section>
  )
}
