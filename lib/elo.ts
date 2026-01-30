/**
 * Elo rating system for adaptive word difficulty
 * Based on chess Elo system adapted for pronunciation practice
 */

const K_FACTOR = 32

export type EloLevelCutoffs = {
  p10: number
  p25: number
  p45: number
  p65: number
  p80: number
  p93: number
}

const DEFAULT_ELO_LEVEL_CUTOFFS: EloLevelCutoffs = {
  p10: 1200,
  p25: 1350,
  p45: 1500,
  p65: 1650,
  p80: 1800,
  p93: 1950,
}

const LEVEL_PERCENTILES = [
  { level: 1, max: 0.1 },
  { level: 2, max: 0.25 },
  { level: 3, max: 0.45 },
  { level: 4, max: 0.65 },
  { level: 5, max: 0.8 },
  { level: 6, max: 0.93 },
  { level: 7, max: 1 },
]

export function percentileToLevel(percentile: number): number {
  const clamped = Math.min(Math.max(percentile, 0), 1)
  const band = LEVEL_PERCENTILES.find((entry) => clamped <= entry.max)
  return band?.level ?? 1
}

export function normalizeEloCutoffs(
  cutoffs?: Partial<EloLevelCutoffs> | null
): EloLevelCutoffs {
  return {
    p10: cutoffs?.p10 ?? DEFAULT_ELO_LEVEL_CUTOFFS.p10,
    p25: cutoffs?.p25 ?? DEFAULT_ELO_LEVEL_CUTOFFS.p25,
    p45: cutoffs?.p45 ?? DEFAULT_ELO_LEVEL_CUTOFFS.p45,
    p65: cutoffs?.p65 ?? DEFAULT_ELO_LEVEL_CUTOFFS.p65,
    p80: cutoffs?.p80 ?? DEFAULT_ELO_LEVEL_CUTOFFS.p80,
    p93: cutoffs?.p93 ?? DEFAULT_ELO_LEVEL_CUTOFFS.p93,
  }
}

export function levelFromElo(
  elo: number,
  cutoffs?: Partial<EloLevelCutoffs> | null
): number {
  const resolved = normalizeEloCutoffs(cutoffs)
  if (elo <= resolved.p10) return 1
  if (elo <= resolved.p25) return 2
  if (elo <= resolved.p45) return 3
  if (elo <= resolved.p65) return 4
  if (elo <= resolved.p80) return 5
  if (elo <= resolved.p93) return 6
  return 7
}

const PERCENTILE_ANCHORS = [
  { key: "p10", value: 0.1 },
  { key: "p25", value: 0.25 },
  { key: "p45", value: 0.45 },
  { key: "p65", value: 0.65 },
  { key: "p80", value: 0.8 },
  { key: "p93", value: 0.93 },
]

function interpolatePercentile(
  elo: number,
  lowElo: number,
  highElo: number,
  lowPct: number,
  highPct: number
): number {
  if (highElo === lowElo) return lowPct
  const t = (elo - lowElo) / (highElo - lowElo)
  return lowPct + t * (highPct - lowPct)
}

export function eloToPercentileApprox(
  elo: number,
  cutoffs?: Partial<EloLevelCutoffs> | null
): number {
  const resolved = normalizeEloCutoffs(cutoffs)
  const anchors = PERCENTILE_ANCHORS.map(({ key, value }) => ({
    elo: resolved[key as keyof EloLevelCutoffs],
    pct: value,
  }))

  if (elo <= anchors[0].elo) {
    const span = anchors[1].elo - anchors[0].elo
    const minElo = Math.max(0, anchors[0].elo - span)
    return Math.max(0, interpolatePercentile(elo, minElo, anchors[0].elo, 0, anchors[0].pct))
  }

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const current = anchors[i]
    const next = anchors[i + 1]
    if (elo <= next.elo) {
      return interpolatePercentile(elo, current.elo, next.elo, current.pct, next.pct)
    }
  }

  const last = anchors[anchors.length - 1]
  const lastSpan = last.elo - anchors[anchors.length - 2].elo
  const maxElo = last.elo + lastSpan
  return Math.min(1, interpolatePercentile(elo, last.elo, maxElo, last.pct, 1))
}

export function percentileToDisplay(percentile: number): number {
  return Math.round(Math.min(Math.max(percentile, 0), 1) * 100)
}

export interface EloUpdate {
  newUserElo: number
  newWordElo: number
  userEloDelta: number
  wordEloDelta: number
}

/**
 * Calculate expected score using Elo formula
 * @param ratingA - Rating of player A
 * @param ratingB - Rating of player B
 * @returns Expected score for player A (0 to 1)
 */
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * Calculate new Elo ratings after an attempt
 * @param userElo - Current user Elo rating
 * @param wordElo - Current word Elo rating
 * @param success - Whether the user succeeded
 * @returns New ratings for both user and word
 */
export function calculateEloUpdate(
  userElo: number,
  wordElo: number,
  success: boolean
): EloUpdate {
  const actualScore = success ? 1 : 0
  const expectedUserScore = expectedScore(userElo, wordElo)

  const userEloDelta = Math.round(K_FACTOR * (actualScore - expectedUserScore))
  const wordEloDelta = -userEloDelta // Word gains what user loses and vice versa

  return {
    newUserElo: userElo + userEloDelta,
    newWordElo: wordElo + wordEloDelta,
    userEloDelta,
    wordEloDelta,
  }
}

/**
 * Select next word based on user Elo with tolerance for ~50% success rate
 * @param userElo - Current user Elo rating
 * @param availableWords - Words with their Elo ratings
 * @param recentWords - Words attempted recently (to avoid repetition)
 * @param tolerance - Elo range tolerance (default 100)
 * @returns Selected word or null if none available
 */
export function selectAdaptiveWord(
  userElo: number,
  availableWords: Array<{ word: string; currentElo: number }>,
  recentWords: string[] = [],
  tolerance: number = 100
): { word: string; currentElo: number } | null {
  if (availableWords.length === 0) return null

  // Filter out recent words
  const candidates = availableWords.filter((w) => !recentWords.includes(w.word))

  if (candidates.length === 0) {
    // If all words are recent, reset and pick from all
    return selectFromPool(availableWords, userElo, tolerance)
  }

  return selectFromPool(candidates, userElo, tolerance)
}

function selectFromPool(
  pool: Array<{ word: string; currentElo: number }>,
  userElo: number,
  tolerance: number
): { word: string; currentElo: number } | null {
  if (pool.length === 0) return null

  // Find words within tolerance range
  let matches = pool.filter((w) => Math.abs(w.currentElo - userElo) <= tolerance)

  // If no matches, expand tolerance
  if (matches.length === 0) {
    matches = pool.filter((w) => Math.abs(w.currentElo - userElo) <= tolerance * 2)
  }

  // If still no matches, use all words
  if (matches.length === 0) {
    matches = pool
  }

  // Random selection from matches (weighted slightly toward closer matches)
  const weights = matches.map((w) => {
    const distance = Math.abs(w.currentElo - userElo)
    return Math.max(1, tolerance - distance) // Higher weight for closer matches
  })

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < matches.length; i++) {
    random -= weights[i]
    if (random <= 0) return matches[i]
  }

  return matches[0]
}

/**
 * Category to base Elo mapping
 */
export const CATEGORY_ELO: Record<string, number> = {
  "First Grade": 1200,
  "Third Grade": 1400,
  "Fifth Grade": 1500,
  "Seventh Grade": 1600,
  "Ninth Grade": 1800,
  "SAT Style": 1800,
  Medical: 1700,
  "Law Enforcement & Legal": 1700,
  "Church & Religious": 1700,
  "Linguistic Curiosities": 1700,
  "Bonus: Slang Words": 1500,
}

/**
 * Get base Elo for a category
 */
export function getCategoryBaseElo(category: string): number {
  return CATEGORY_ELO[category] || 1500
}
