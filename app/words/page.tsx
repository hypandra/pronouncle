"use client"

import { useState, useCallback } from "react"
import { WORD_DATA } from "@/lib/word-data"
import { WordList } from "@/components/word-list"
import { SpeakingView } from "@/components/speaking-view"
import { useProgress } from "@/contexts/progress-context"

export default function PronounceAppPage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"list" | "speaking">("list")
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const [isAdaptiveMode, setIsAdaptiveMode] = useState(false)

  const {
    isLoading,
    getNextWord,
    selectWordByName,
    recordAttempt,
    wordStats,
    isAuthenticated,
  } = useProgress()


  const handleSelectWord = (index: number) => {
    setCurrentWordIndex(index)
    setViewMode("speaking")
    setHighlightedIndex(null)
    setIsAdaptiveMode(false)
  }

  const handleStartAdaptive = () => {
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
  }, [isAdaptiveMode, getNextWord, selectWordByName])

  const handleBackToList = () => {
    setViewMode("list")
    setIsAdaptiveMode(false)
  }

  const handleNextWord = useCallback(
    (nextIndex: number) => {
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
    [isAdaptiveMode, getNextWord, selectWordByName]
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
        <WordList
          highlightedIndex={highlightedIndex}
          onSelectWord={handleSelectWord}
          onStartAdaptive={handleStartAdaptive}
          isLoading={isLoading}
          wordStats={wordStats}
          isAuthenticated={isAuthenticated}
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
