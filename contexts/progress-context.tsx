"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react"
import { useSession } from "@/lib/auth-client"
import {
  UserProgress,
  DEFAULT_PROGRESS,
  WordStats,
  AttemptRecord,
} from "@/lib/progress"
import {
  calculateEloUpdate,
  eloToPercentileApprox,
  levelFromElo,
  percentileToDisplay,
  selectAdaptiveWord,
} from "@/lib/elo"
import type { EloLevelCutoffs } from "@/lib/elo"
import { WORD_DATA } from "@/lib/word-data"

interface WordElo {
  word: string
  currentElo: number
}

interface ProgressContextValue {
  progress: UserProgress
  isLoading: boolean
  isAuthenticated: boolean
  skillLevel: number
  percentile: number | null
  eloLevelCutoffs: EloLevelCutoffs | null
  wordElos: WordElo[]
  wordStats: Record<string, WordStats>
  attempts: AttemptRecord[]
  isHistoryLoading: boolean
  recordAttempt: (word: string, success: boolean, transcript?: string) => Promise<number | null>
  getNextWord: () => string | null
  selectWordByName: (word: string) => number // Returns index in WORD_DATA
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS)
  const [wordElos, setWordElos] = useState<WordElo[]>([])
  const [skillLevel, setSkillLevel] = useState(() => levelFromElo(DEFAULT_PROGRESS.elo))
  const [percentile, setPercentile] = useState<number | null>(null)
  const [eloLevelCutoffs, setEloLevelCutoffs] = useState<EloLevelCutoffs | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [wordStats, setWordStats] = useState<Record<string, WordStats>>({})
  const [attempts, setAttempts] = useState<AttemptRecord[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)

  const isAuthenticated = !!session?.user

  const loadDefaultState = useCallback(() => {
    setProgress(DEFAULT_PROGRESS)
    setWordStats({})
    setAttempts([])
    setEloLevelCutoffs(null)
    setSkillLevel(levelFromElo(DEFAULT_PROGRESS.elo, null))
    setPercentile(percentileToDisplay(eloToPercentileApprox(DEFAULT_PROGRESS.elo, null)))
  }, [setProgress, setWordStats, setAttempts, setEloLevelCutoffs, setSkillLevel, setPercentile])

  const loadServerState = useCallback(async () => {
    const response = await fetch("/api/progress")
    if (!response.ok) {
      return
    }
    const data = await response.json()
    if (!data) return

    setProgress({
      ...DEFAULT_PROGRESS,
      elo: data.elo ?? DEFAULT_PROGRESS.elo,
      totalAttempts: data.totalAttempts ?? 0,
      successfulAttempts: data.successfulAttempts ?? 0,
      recentWords: [],
      wordStats: {},
      attempts: [],
    })
    setWordStats({})
    setAttempts([])
    if (data.eloLevelCutoffs) {
      setEloLevelCutoffs(data.eloLevelCutoffs)
    } else {
      setEloLevelCutoffs(null)
    }
    if (typeof data.level === "number") {
      setSkillLevel(data.level)
    } else {
      setSkillLevel(levelFromElo(data.elo ?? DEFAULT_PROGRESS.elo, data.eloLevelCutoffs))
    }
    if (typeof data.percentile === "number") {
      setPercentile(data.percentile)
    } else {
      setPercentile(
        percentileToDisplay(
          eloToPercentileApprox(data.elo ?? DEFAULT_PROGRESS.elo, data.eloLevelCutoffs)
        )
      )
    }
  }, [])

  // Load word Elo ratings
  useEffect(() => {
    fetch("/api/words")
      .then((r) => r.json())
      .then((data) => {
        if (data.words) {
          setWordElos(
            data.words.map((w: { word: string; current_elo: number }) => ({
              word: w.word,
              currentElo: w.current_elo,
            }))
          )
        }
      })
      .catch(console.error)
  }, [])

  // Load user progress
  useEffect(() => {
    async function loadProgress() {
      setIsLoading(true)

      if (isPending) {
        loadDefaultState()
        setIsLoading(false)
        return
      }

      if (!isAuthenticated || !session?.user?.id) {
        loadDefaultState()
        setIsLoading(false)
        return
      }

      await loadServerState()
      setIsLoading(false)
    }

    loadProgress()
  }, [isAuthenticated, session?.user?.id, isPending, loadDefaultState, loadServerState])

  useEffect(() => {
    async function loadHistory() {
      if (isPending) return

      if (!isAuthenticated) {
        setIsHistoryLoading(false)
        return
      }

      setIsHistoryLoading(true)
      try {
        const response = await fetch("/api/history")
        if (!response.ok) {
          return
        }
        const data = await response.json()
        if (data) {
          setWordStats(data.wordStats || {})
          setAttempts(data.attempts || [])
        }
      } catch (error) {
        console.error("Failed to load history:", error)
      } finally {
        setIsHistoryLoading(false)
      }
    }

    loadHistory()
  }, [isAuthenticated, isPending])

  const recordAttempt = useCallback(
    async (word: string, success: boolean, transcript?: string) => {
      // Find word Elo
      const wordElo = wordElos.find((w) => w.word === word)
      if (!wordElo) {
        console.error("Word not found in Elo data:", word)
        return null
      }

      // Calculate Elo update locally for immediate feedback
      const update = calculateEloUpdate(progress.elo, wordElo.currentElo, success)

      // Update local state immediately
      setProgress((prev) => ({
        ...prev,
        elo: update.newUserElo,
        totalAttempts: prev.totalAttempts + 1,
        successfulAttempts: prev.successfulAttempts + (success ? 1 : 0),
        recentWords: [word, ...prev.recentWords.filter((w) => w !== word)].slice(0, 10),
      }))

      // Update word Elo locally
      setWordElos((prev) =>
        prev.map((w) => (w.word === word ? { ...w, currentElo: update.newWordElo } : w))
      )

      if (isAuthenticated) {
        // Send to server for persistence
        const response = await fetch("/api/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word,
            success,
            transcript,
            userEloBefore: progress.elo,
          }),
        })
        if (!response.ok) {
          console.warn("Failed to record attempt on server")
        }

        setWordStats((prev) => {
          const current = prev[word] || { successes: 0, failures: 0 }
          return {
            ...prev,
            [word]: {
              successes: current.successes + (success ? 1 : 0),
              failures: current.failures + (success ? 0 : 1),
            },
          }
        })

        setAttempts((prev) =>
          [
            {
              word,
              correct: success,
              wordElo: update.newWordElo,
              userEloBefore: progress.elo,
              userEloAfter: update.newUserElo,
              transcript,
              timestamp: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 200)
        )
        return update.userEloDelta
      } else {
        setWordStats((prev) => {
          const current = prev[word] || { successes: 0, failures: 0 }
          return {
            ...prev,
            [word]: {
              successes: current.successes + (success ? 1 : 0),
              failures: current.failures + (success ? 0 : 1),
            },
          }
        })

        setAttempts((prev) =>
          [
            {
              word,
              correct: success,
              wordElo: update.newWordElo,
              userEloBefore: progress.elo,
              userEloAfter: update.newUserElo,
              transcript,
              timestamp: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 200)
        )
        return update.userEloDelta
      }
    },
    [progress, wordElos, isAuthenticated]
  )

  const getNextWord = useCallback(() => {
    if (wordElos.length === 0) return null

    const selected = selectAdaptiveWord(progress.elo, wordElos, progress.recentWords)

    return selected?.word || null
  }, [progress.elo, progress.recentWords, wordElos])

  const selectWordByName = useCallback((word: string) => {
    return WORD_DATA.findIndex((w) => w.word === word)
  }, [])

  return (
    <>
      <ProgressContext.Provider
        value={{
          progress,
          isLoading: isLoading || isPending,
          isAuthenticated,
          skillLevel,
          percentile,
          eloLevelCutoffs,
          wordElos,
          wordStats,
          attempts,
          isHistoryLoading,
          recordAttempt,
          getNextWord,
          selectWordByName,
        }}
      >
        {children}
      </ProgressContext.Provider>
    </>
  )
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider")
  }
  return context
}
