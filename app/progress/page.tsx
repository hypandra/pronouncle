"use client"

import { useMemo } from "react"
import Link from "next/link"
import { PronouncleHeader } from "@/components/pronouncle-header"
import { EloProgressChart } from "@/components/elo-progress-chart"
import { useProgress } from "@/contexts/progress-context"
import { WORD_DATA } from "@/lib/word-data"

export default function StatsPage() {
  const {
    attempts,
    progress,
    percentile,
    eloLevelCutoffs,
    isHistoryLoading,
    isAuthenticated,
  } = useProgress()

  const totalAttempts = progress.totalAttempts || attempts.length
  const totalWins = progress.successfulAttempts || attempts.filter((a) => a.correct).length
  const attemptsWithNumbers = useMemo(() => {
    const ordered = [...attempts].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    return ordered.map((attempt, index) => ({
      ...attempt,
      attemptNumber: index + 1,
    }))
  }, [attempts])

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <PronouncleHeader />

        <p className="text-sm text-muted-foreground mb-6">
          Your score shows how you rank against other learners. It updates as you practice and
          adjusts which words you see next.
        </p>

        {!isAuthenticated ? (
          <div className="border border-rule bg-card p-4 text-sm text-muted-foreground">
            Sign in to track your score, history, and adaptive rankings.
            <Link href="/signin" className="text-ink hover:underline ml-2">
              Sign in
            </Link>
            .
          </div>
        ) : isHistoryLoading ? (
          <p className="text-sm text-muted-foreground">Loading progress...</p>
        ) : attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No attempts yet. Play a few words to unlock your progress chart.
          </p>
        ) : (
          <EloProgressChart
            attempts={attemptsWithNumbers}
            totalWords={WORD_DATA.length}
            currentPercentile={percentile}
            eloLevelCutoffs={eloLevelCutoffs}
            totalAttempts={totalAttempts}
            totalWins={totalWins}
          />
        )}
      </div>
    </div>
  )
}
