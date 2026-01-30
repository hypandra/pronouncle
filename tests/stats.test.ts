import { describe, expect, it } from "vitest"
import { computeCurrentStreak, computeUniqueWords } from "@/lib/stats"

const baseAttempts = [
  { word: "alpha", correct: true, timestamp: "2024-01-01T00:00:00Z" },
  { word: "bravo", correct: false, timestamp: "2024-01-02T00:00:00Z" },
  { word: "alpha", correct: false, timestamp: "2024-01-03T00:00:00Z" },
  { word: "charlie", correct: false, timestamp: "2024-01-04T00:00:00Z" },
  { word: "delta", correct: false, timestamp: "2024-01-05T00:00:00Z" },
]

describe("stats helpers", () => {
  it("computes unique words", () => {
    expect(computeUniqueWords(baseAttempts)).toBe(4)
  })

  it("computes current streak from latest attempts", () => {
    const streak = computeCurrentStreak(baseAttempts)
    expect(streak.count).toBe(4)
    expect(streak.correct).toBe(false)
  })

  it("returns zero streak for empty attempts", () => {
    expect(computeCurrentStreak([])).toEqual({ count: 0, correct: true })
  })
})
