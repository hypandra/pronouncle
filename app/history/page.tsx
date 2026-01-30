"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useProgress } from "@/contexts/progress-context"
import { PronouncleHeader } from "@/components/pronouncle-header"

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default function HistoryPage() {
  const { attempts, isHistoryLoading, isAuthenticated } = useProgress()

  const grouped = useMemo(() => {
    const groups: Record<string, typeof attempts> = {}
    attempts.forEach((attempt) => {
      const date = new Date(attempt.timestamp)
      const key = Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString()
      if (!groups[key]) groups[key] = []
      groups[key].push(attempt)
    })
    return groups
  }, [attempts])

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <PronouncleHeader />

        {isHistoryLoading && (
          <p className="text-sm text-muted-foreground">Loading history...</p>
        )}

        {!isHistoryLoading && !isAuthenticated && (
          <div className="border border-rule bg-card p-4 text-sm text-muted-foreground">
            Sign in to save and review your pronunciation history.
            <Link href="/signin" className="text-ink hover:underline ml-2">
              Sign in
            </Link>
            .
          </div>
        )}

        {!isHistoryLoading && isAuthenticated && attempts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No attempts yet. Try a word to start your history.
          </p>
        )}

        {!isHistoryLoading && isAuthenticated && attempts.length > 0 && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <section key={date}>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 border-b border-rule pb-2">
                  {date}
                </h3>
                <div className="space-y-3">
                  {items.map((attempt, index) => (
                    <div
                      key={`${attempt.word}-${attempt.timestamp}-${index}`}
                      className="border border-rule p-4 bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-display text-ink">{attempt.word}</span>
                        <span
                          className={`text-xs uppercase tracking-widest ${
                            attempt.correct ? "text-success-green" : "text-accent-red"
                          }`}
                        >
                          {attempt.correct ? "Success" : "Miss"}
                        </span>
                      </div>
                      {attempt.transcript && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          "{attempt.transcript}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimestamp(attempt.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
