"use client"

import { useProgress } from "@/contexts/progress-context"

export function EloDisplay() {
  const { percentile, isLoading } = useProgress()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <span className="text-sm text-muted-foreground font-mono">...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-2">
      <span className="text-lg font-mono font-semibold text-ink">
        {typeof percentile === "number" ? `${percentile}` : "—"}
      </span>
    </div>
  )
}
