"use client"

import React, { useRef, useEffect, useState } from "react"
import { Play, CheckCircle2, XCircle, Plus } from "lucide-react"
import { WORD_DATA } from "@/lib/word-data"
import { PronouncleHeader } from "./pronouncle-header"
import { EloDisplay } from "@/components/elo-display"
import { SuggestWordDialog } from "./suggest-word-dialog"
import type { WordStats } from "@/lib/progress"
import Link from "next/link"

type WordItem = typeof WORD_DATA[0] & { originalIndex?: number }

interface WordListProps {
  highlightedIndex: number | null
  onSelectWord: (index: number) => void
  onStartAdaptive: () => void
  isLoading: boolean
  wordStats: Record<string, WordStats>
  isAuthenticated: boolean
  words?: WordItem[]
  hideSignInBanner?: boolean
}

export function WordList({
  highlightedIndex,
  onSelectWord,
  onStartAdaptive,
  isLoading,
  wordStats,
  isAuthenticated,
  words,
  hideSignInBanner = false,
}: WordListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const listWords: WordItem[] = words ?? WORD_DATA
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false)

  useEffect(() => {
    if (highlightedIndex !== null && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedIndex])

  // Group words by category
  const categories = listWords.reduce((acc, item, index) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    const originalIndex =
      typeof item.originalIndex === "number" ? item.originalIndex : index
    acc[item.category].push({ ...item, originalIndex })
    return acc
  }, {} as Record<string, Array<WordItem & { originalIndex: number }>>)

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <PronouncleHeader />

        {!isAuthenticated && !hideSignInBanner && (
          <div className="border border-rule bg-card p-4 mt-4 text-sm text-muted-foreground">
            Sign in to track your score, save progress, and access all features.
            <Link href="/signin" className="text-ink hover:underline ml-2">
              Sign in
            </Link>
            .
          </div>
        )}

        {isAuthenticated && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <Link
                href="/progress"
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-ink transition-colors"
              >
                Score
                <div className="text-ink">
                  <EloDisplay />
                </div>
              </Link>
              <div className="flex gap-2 w-full md:w-auto md:ml-auto">
                <button
                  onClick={() => setSuggestDialogOpen(true)}
                  className="h-12 px-4 border border-rule text-ink font-medium flex items-center justify-center gap-2 hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink"
                  title="Suggest a word"
                >
                  <Plus className="h-5 w-5" />
                  <span className="hidden md:inline">Suggest</span>
                </button>
                <button
                  onClick={onStartAdaptive}
                  disabled={isLoading}
                  className="flex-1 md:flex-none h-12 px-6 bg-success-green text-white font-semibold flex items-center justify-center gap-3 hover:bg-success-green/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-green disabled:opacity-50"
                >
                  <Play className="h-5 w-5" />
                  Play
                </button>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && (
          <>
            <div className="mt-6 mb-6 border-b border-rule" />
          <div ref={listRef} className="space-y-8">
            {Object.entries(categories).map(([category, words]) => (
              <section key={category}>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 border-b border-rule pb-2">
                  {category}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {words.map((item) => {
                    const stats = wordStats[item.word]
                    const hasSuccess = (stats?.successes || 0) > 0
                    const hasFailure = (stats?.failures || 0) > 0
                    return (
                      <button
                        key={item.originalIndex}
                        ref={(el) => { itemRefs.current[item.originalIndex] = el as HTMLDivElement | null }}
                        onClick={() => onSelectWord(item.originalIndex)}
                        className={`text-left p-4 border border-rule hover:border-ink hover:bg-muted/30 transition-colors cursor-pointer ${
                          highlightedIndex === item.originalIndex ? 'bg-success-green/10 border-success-green' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-lg font-display font-semibold text-ink">
                            {item.word}
                          </span>
                          <div className="flex items-center gap-1">
                            {hasSuccess && (
                              <span className="inline-flex items-center text-success-green" title="Completed successfully">
                                <CheckCircle2 className="h-4 w-4" />
                              </span>
                            )}
                            {hasFailure && (
                              <span className="inline-flex items-center text-accent-red" title="Needs practice">
                                <XCircle className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
          </>
        )}
      </div>

      <SuggestWordDialog
        open={suggestDialogOpen}
        onOpenChange={setSuggestDialogOpen}
      />
    </div>
  )
}
