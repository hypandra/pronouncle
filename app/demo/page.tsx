"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { WORD_DATA } from "@/lib/word-data"
import { WordList } from "@/components/word-list"
import { SpeakingView } from "@/components/speaking-view"
import { useProgress } from "@/contexts/progress-context"

export default function PronounceDemoPage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"list" | "speaking">("list")
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const [isAdaptiveMode, setIsAdaptiveMode] = useState(false)
  const demoWordNames = ["faux pas", "colonel", "mischievous", "queue", "anemone"]
  const demoWords = demoWordNames
    .map((word) => {
      const index = WORD_DATA.findIndex((item) => item.word === word)
      if (index < 0) return null
      return { ...WORD_DATA[index], originalIndex: index }
    })
    .filter(
      (item): item is typeof WORD_DATA[number] & { originalIndex: number } => item !== null
    )

  const {
    isLoading,
    getNextWord,
    selectWordByName,
    recordAttempt,
    wordStats,
    isAuthenticated,
  } = useProgress()
  // Demo page always runs in demo mode, even for authenticated users
  const isDemo = true
  const demoIndices = demoWords.map((item) => item.originalIndex)

  const getNextDemoIndex = (currentIndex?: number) => {
    if (demoIndices.length === 0) return 0
    const options =
      typeof currentIndex === "number"
        ? demoIndices.filter((index) => index !== currentIndex)
        : demoIndices
    const pool = options.length > 0 ? options : demoIndices
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const handleSelectWord = (index: number) => {
    setCurrentWordIndex(index)
    setViewMode("speaking")
    setHighlightedIndex(null)
    setIsAdaptiveMode(false)
  }

  const handleStartAdaptive = () => {
    if (isDemo) {
      setCurrentWordIndex(getNextDemoIndex(currentWordIndex))
      setViewMode("speaking")
      setIsAdaptiveMode(true)
      return
    }

    const nextWord = getNextWord()
    if (nextWord) {
      const index = selectWordByName(nextWord)
      if (index >= 0) {
        setCurrentWordIndex(index)
        setViewMode("speaking")
        setIsAdaptiveMode(true)
      }
    }
  }

  const handleChangeWord = useCallback(() => {
    if (isDemo) {
      const currentIndex = demoIndices.indexOf(currentWordIndex)
      const nextIndex =
        currentIndex >= 0
          ? demoIndices[(currentIndex + 1) % demoIndices.length]
          : demoIndices[0]
      setCurrentWordIndex(nextIndex)
      return
    }
    if (isAdaptiveMode) {
      const nextWord = getNextWord()
      if (nextWord) {
        const index = selectWordByName(nextWord)
        if (index >= 0) {
          setCurrentWordIndex(index)
          return
        }
      }
    }
    setCurrentWordIndex((prev) => (prev + 1) % WORD_DATA.length)
  }, [isDemo, demoIndices, currentWordIndex, isAdaptiveMode, getNextWord, selectWordByName])

  const handleBackToList = () => {
    setViewMode("list")
    setIsAdaptiveMode(false)
  }

  const handleNextWord = useCallback(
    (nextIndex: number) => {
      if (isDemo) {
        setCurrentWordIndex(getNextDemoIndex(currentWordIndex))
        return
      }
      if (isAdaptiveMode) {
        const nextWord = getNextWord()
        if (nextWord) {
          const index = selectWordByName(nextWord)
          if (index >= 0) {
            setCurrentWordIndex(index)
            return
          }
        }
      }
      setCurrentWordIndex(nextIndex)
    },
    [isDemo, currentWordIndex, getNextDemoIndex, isAdaptiveMode, getNextWord, selectWordByName]
  )

  const handleAttemptResult = useCallback(
    async (success: boolean, transcript?: string) => {
      const word = WORD_DATA[currentWordIndex].word
      return recordAttempt(word, success, transcript)
    },
    [currentWordIndex, recordAttempt]
  )

  if (viewMode === "list") {
    return (
      <div>
        <div className="border-b border-rule bg-card/70">
          <div className="max-w-2xl mx-auto px-6 py-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="max-w-md">
              <p className="text-sm font-semibold text-ink">Demo mode</p>
              <p className="text-sm text-muted-foreground">
                {isAuthenticated
                  ? "Practice these five demo words. Your progress is not tracked here."
                  : "Practice five words with recording and transcription. Sign up to track your score."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:justify-self-end">
              {isAuthenticated ? (
                <Link
                  href="/words"
                  className="inline-flex items-center justify-center h-12 px-7 bg-success-green text-white text-sm font-semibold hover:bg-success-green/90 transition-colors"
                >
                  Go to full word list
                </Link>
              ) : (
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center h-12 px-7 bg-accent-red text-white text-sm font-semibold hover:bg-accent-red/90 transition-colors"
                >
                  Sign up
                </Link>
              )}
            </div>
          </div>
        </div>
        <WordList
          highlightedIndex={highlightedIndex}
          onSelectWord={handleSelectWord}
          onStartAdaptive={handleStartAdaptive}
          isLoading={isLoading}
          wordStats={wordStats}
          isAuthenticated={isAuthenticated}
          words={isDemo ? demoWords : undefined}
          hideSignInBanner
        />
      </div>
    )
  }

  return (
    <SpeakingView
      currentWordIndex={currentWordIndex}
      onChangeWord={handleChangeWord}
      onBackToList={handleBackToList}
      onNextWord={handleNextWord}
      onAttemptResult={handleAttemptResult}
      isAdaptiveMode={isAdaptiveMode}
    />
  )
}
