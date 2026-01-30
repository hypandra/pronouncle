/**
 * Progress storage - hybrid localStorage (anonymous) / database (authenticated)
 */

import { createClient } from "@/lib/supabase/client"

export interface WordStats {
  successes: number
  failures: number
}

export interface AttemptRecord {
  word: string
  correct: boolean
  wordElo: number
  userEloBefore: number
  userEloAfter: number
  transcript?: string
  timestamp: string
}

export interface UserProgress {
  elo: number
  totalAttempts: number
  successfulAttempts: number
  recentWords: string[] // Last N words attempted (for variety)
  wordStats: Record<string, WordStats>
  attempts: AttemptRecord[]
}

const STORAGE_KEY = "pronouncle_progress"
const MAX_RECENT_WORDS = 10
const MAX_ATTEMPTS = 200

// Default progress for new users
export const DEFAULT_PROGRESS: UserProgress = {
  elo: 1500,
  totalAttempts: 0,
  successfulAttempts: 0,
  recentWords: [],
  wordStats: {},
  attempts: [],
}

function normalizeAttempts(
  attempts: Array<Partial<AttemptRecord> & { success?: boolean; createdAt?: string }>,
  fallbackElo: number
): AttemptRecord[] {
  return attempts.map((attempt) => ({
    word: attempt.word || "",
    correct: attempt.correct ?? attempt.success ?? false,
    wordElo: attempt.wordElo ?? 1500,
    userEloBefore: attempt.userEloBefore ?? fallbackElo,
    userEloAfter: attempt.userEloAfter ?? fallbackElo,
    transcript: attempt.transcript,
    timestamp: attempt.timestamp || attempt.createdAt || new Date().toISOString(),
  }))
}

function rebuildWordStats(attempts: AttemptRecord[]): Record<string, WordStats> {
  const stats: Record<string, WordStats> = {}
  attempts.forEach((attempt) => {
    if (!attempt.word) return
    const entry = stats[attempt.word] || { successes: 0, failures: 0 }
    if (attempt.correct) {
      entry.successes += 1
    } else {
      entry.failures += 1
    }
    stats[attempt.word] = entry
  })
  return stats
}

/**
 * Get progress from localStorage (anonymous users)
 */
export function getLocalProgress(): UserProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_PROGRESS
    const parsed = JSON.parse(stored)
    const attempts = normalizeAttempts(parsed.attempts || [], parsed.elo ?? DEFAULT_PROGRESS.elo)
    const wordStats =
      parsed.wordStats && Object.keys(parsed.wordStats).length > 0
        ? parsed.wordStats
        : rebuildWordStats(attempts)

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      attempts,
      wordStats,
    }
  } catch {
    return DEFAULT_PROGRESS
  }
}

/**
 * Save progress to localStorage (anonymous users)
 */
export function saveLocalProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (e) {
    console.error("Failed to save progress to localStorage:", e)
  }
}

/**
 * Update progress after an attempt (localStorage version)
 */
export function updateLocalProgress(
  currentProgress: UserProgress,
  word: string,
  success: boolean,
  newElo: number,
  wordEloBefore: number,
  wordEloAfter: number
): UserProgress {
  const recentWords = [word, ...currentProgress.recentWords.filter((w) => w !== word)].slice(
    0,
    MAX_RECENT_WORDS
  )

  const currentStats = currentProgress.wordStats[word] || { successes: 0, failures: 0 }
  const updatedStats: WordStats = {
    successes: currentStats.successes + (success ? 1 : 0),
    failures: currentStats.failures + (success ? 0 : 1),
  }

  const attempts: AttemptRecord[] = [
    {
      word,
      correct: success,
      wordElo: wordEloAfter,
      userEloBefore: currentProgress.elo,
      userEloAfter: newElo,
      timestamp: new Date().toISOString(),
    },
    ...currentProgress.attempts,
  ].slice(0, MAX_ATTEMPTS)

  const updated: UserProgress = {
    elo: newElo,
    totalAttempts: currentProgress.totalAttempts + 1,
    successfulAttempts: currentProgress.successfulAttempts + (success ? 1 : 0),
    recentWords,
    wordStats: {
      ...currentProgress.wordStats,
      [word]: updatedStats,
    },
    attempts,
  }

  saveLocalProgress(updated)
  return updated
}

/**
 * Clear localStorage progress (after sync to database)
 */
export function clearLocalProgress(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Sync localStorage progress to database when user logs in
 */
export async function syncProgressToDatabase(userId: string): Promise<void> {
  const local = getLocalProgress()

  // Only sync if there's meaningful progress
  if (local.totalAttempts === 0) return

  const supabase = createClient()

  // Upsert user_elo record
  const { error } = await supabase.from("user_elo").upsert(
    {
      user_id: userId,
      elo_rating: local.elo,
      total_attempts: local.totalAttempts,
      successful_attempts: local.successfulAttempts,
    },
    { onConflict: "user_id" }
  )

  if (error) {
    console.error("Failed to sync progress to database:", error)
    return
  }

  // Clear localStorage after successful sync
  clearLocalProgress()
}

/**
 * Load progress from database (authenticated users)
 */
export async function getDatabaseProgress(userId: string): Promise<UserProgress | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_elo")
    .select("elo_rating, total_attempts, successful_attempts")
    .eq("user_id", userId)
    .single()

  if (error || !data) return null

  // Get recent attempts for recent words
  const { data: recentAttempts } = await supabase
    .from("attempt_history")
    .select("word, success, transcript, created_at, user_elo_before, user_elo_after, word_elo_before")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_ATTEMPTS)

  const wordStats: Record<string, WordStats> = {}
  const attempts: AttemptRecord[] = (recentAttempts || []).map((attempt) => {
    const stats = wordStats[attempt.word] || { successes: 0, failures: 0 }
    if (attempt.success) {
      stats.successes += 1
    } else {
      stats.failures += 1
    }
    wordStats[attempt.word] = stats

    return {
      word: attempt.word,
      correct: attempt.success,
      wordElo: attempt.word_elo_before ?? 1500,
      userEloBefore: attempt.user_elo_before ?? 1500,
      userEloAfter: attempt.user_elo_after ?? 1500,
      transcript: attempt.transcript || undefined,
      timestamp: attempt.created_at,
    }
  })

  return {
    elo: data.elo_rating,
    totalAttempts: data.total_attempts,
    successfulAttempts: data.successful_attempts,
    recentWords: (recentAttempts || []).slice(0, MAX_RECENT_WORDS).map((a) => a.word),
    wordStats,
    attempts,
  }
}
