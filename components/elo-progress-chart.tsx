"use client"

import { useMemo, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { computeCurrentStreak, computeUniqueWords } from "@/lib/stats"
import {
  eloToPercentileApprox,
  normalizeEloCutoffs,
  percentileToDisplay,
} from "@/lib/elo"
import type { EloLevelCutoffs } from "@/lib/elo"

interface AttemptPoint {
  attemptNumber: number
  word: string
  wordElo: number
  correct: boolean
  userEloBefore: number
  userEloAfter: number
  timestamp: string
}

interface EloProgressChartProps {
  attempts: AttemptPoint[]
  totalWords: number
  currentPercentile: number | null
  eloLevelCutoffs: EloLevelCutoffs | null
  totalAttempts: number
  totalWins: number
}

function formatDelta(before: number, after: number) {
  const delta = after - before
  const sign = delta >= 0 ? "+" : ""
  return `${sign}${delta}`
}

function TooltipContent({ active, payload, cutoffs }: any) {
  if (!active || !payload || payload.length === 0) return null

  const attempt = payload[0].payload as AttemptPoint
  const resolvedCutoffs = normalizeEloCutoffs(cutoffs)
  const beforePct = percentileToDisplay(
    eloToPercentileApprox(attempt.userEloBefore, resolvedCutoffs)
  )
  const afterPct = percentileToDisplay(
    eloToPercentileApprox(attempt.userEloAfter, resolvedCutoffs)
  )
  return (
    <div className="border border-rule bg-background p-3 shadow-soft text-xs space-y-1">
      <div className="font-semibold text-ink">Attempt #{attempt.attemptNumber}</div>
      <div>Word: "{attempt.word}"</div>
      <div>
        Result: {attempt.correct ? "✓ Correct" : "✗ Incorrect"}
      </div>
      <div>
        Score: {beforePct} → {afterPct} ({formatDelta(beforePct, afterPct)})
      </div>
    </div>
  )
}

export function EloProgressChart({
  attempts,
  totalWords,
  currentPercentile,
  eloLevelCutoffs,
  totalAttempts,
  totalWins,
}: EloProgressChartProps) {
  const [showAll, setShowAll] = useState(false)
  const resolvedCutoffs = useMemo(
    () => normalizeEloCutoffs(eloLevelCutoffs),
    [eloLevelCutoffs]
  )

  const ordered = useMemo(() => {
    return [...attempts].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }, [attempts])

  const data = useMemo(
    () =>
      ordered.map((attempt) => ({
        ...attempt,
        userPercentileAfter: percentileToDisplay(
          eloToPercentileApprox(attempt.userEloAfter, resolvedCutoffs)
        ),
      })),
    [ordered, resolvedCutoffs]
  )

  const displayData = useMemo(() => {
    if (showAll || data.length <= 50) return data
    return data.slice(-50)
  }, [data, showAll])

  const winRate = totalAttempts > 0 ? Math.round((totalWins / totalAttempts) * 100) : 0

  const currentStreak = useMemo(() => computeCurrentStreak(data), [data])
  const uniqueWords = useMemo(() => computeUniqueWords(data), [data])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="border border-rule bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Current score</p>
          <p className="text-2xl font-display text-ink">
            {typeof currentPercentile === "number" ? `${currentPercentile}` : "—"}
          </p>
        </div>
        <div className="border border-rule bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total attempts</p>
          <p className="text-2xl font-display text-ink">{totalAttempts}</p>
        </div>
        <div className="border border-rule bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Win rate</p>
          <p className="text-2xl font-display text-ink">
            {winRate}% <span className="text-sm text-muted-foreground">({totalWins}/{totalAttempts})</span>
          </p>
        </div>
        <div className="border border-rule bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Current streak</p>
          <p className="text-2xl font-display text-ink">
            {currentStreak.count} {currentStreak.correct ? "✓" : "✗"}
          </p>
        </div>
        <div className="border border-rule bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Unique words</p>
          <p className="text-2xl font-display text-ink">
            {uniqueWords}/{totalWords}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-display text-ink">Score over time</h2>
        {data.length > 50 && (
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="text-sm text-muted-foreground hover:text-ink transition-colors"
          >
            {showAll ? "Show recent" : "Show all attempts"}
          </button>
        )}
      </div>

      <div className="border border-rule bg-card p-4">
        {displayData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attempts yet.</p>
        ) : (
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="attemptNumber"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<TooltipContent cutoffs={resolvedCutoffs} />} />
                <Line
                  type="monotone"
                  dataKey="userPercentileAfter"
                  stroke="#2C2C2C"
                  strokeWidth={2}
                  dot={({ cx, cy, payload }) => (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={payload.correct ? "#1E9D61" : "#E85D4A"}
                      stroke="white"
                      strokeWidth={1}
                    />
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
