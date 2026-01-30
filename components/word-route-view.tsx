"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { WORD_DATA } from "@/lib/word-data"
import { SpeakingView } from "@/components/speaking-view"
import { useProgress } from "@/contexts/progress-context"

type CommunityWordData = {
  word: string
  stubDefinition: string
  exampleSentence: string
  category: string
}

interface WordRouteViewProps {
  initialIndex?: number
  communityWord?: CommunityWordData
}

export function WordRouteView({ initialIndex, communityWord }: WordRouteViewProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(initialIndex ?? -1)
  const { recordAttempt } = useProgress()
  const router = useRouter()

  const handleChangeWord = useCallback(() => {
    if (communityWord) {
      // For community words, go back to list instead of cycling
      router.push("/words")
      return
    }
    setCurrentWordIndex((prev) => (prev + 1) % WORD_DATA.length)
  }, [communityWord, router])

  const handleBackToList = useCallback(() => {
    router.push("/words")
  }, [router])

  const handleNextWord = useCallback((nextIndex: number) => {
    if (communityWord) {
      router.push("/words")
      return
    }
    setCurrentWordIndex(nextIndex)
  }, [communityWord, router])

  const handleAttemptResult = useCallback(
    async (success: boolean, transcript?: string) => {
      const word = communityWord?.word ?? WORD_DATA[currentWordIndex].word
      return recordAttempt(word, success, transcript)
    },
    [currentWordIndex, communityWord, recordAttempt]
  )

  return (
    <SpeakingView
      currentWordIndex={currentWordIndex}
      communityWord={communityWord}
      onChangeWord={handleChangeWord}
      onBackToList={handleBackToList}
      onNextWord={handleNextWord}
      onAttemptResult={handleAttemptResult}
      isAdaptiveMode={false}
    />
  )
}
