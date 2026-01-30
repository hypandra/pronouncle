import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import {
  levelFromElo,
  percentileToDisplay,
  percentileToLevel,
  normalizeEloCutoffs,
} from "@/lib/elo"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("user_elo")
      .select("elo_rating, total_attempts, successful_attempts")
      .eq("user_id", session.user.id)
      .single()

    if (error || !data) {
      // New user - return defaults
      const cutoffs = normalizeEloCutoffs(null)
      return NextResponse.json({
        authenticated: true,
        elo: 1500,
        totalAttempts: 0,
        successfulAttempts: 0,
        level: levelFromElo(1500, cutoffs),
        eloLevelCutoffs: cutoffs,
        percentile: percentileToDisplay(0.5),
      })
    }

    const { data: percentileData } = await supabase.rpc("pronouncle_user_elo_percentile", {
      p_user_id: session.user.id,
    })
    const { data: cutoffsRows } = await supabase.rpc("pronouncle_elo_percentile_cutoffs")
    const cutoffs = normalizeEloCutoffs(cutoffsRows?.[0] ?? null)
    const percentile =
      typeof percentileData === "number" ? percentileToDisplay(percentileData) : null
    const level =
      typeof percentileData === "number"
        ? percentileToLevel(percentileData)
        : levelFromElo(data.elo_rating, cutoffs)

    return NextResponse.json({
      authenticated: true,
      elo: data.elo_rating,
      totalAttempts: data.total_attempts,
      successfulAttempts: data.successful_attempts,
      level,
      eloLevelCutoffs: cutoffs,
      percentile,
    })
  } catch (error) {
    console.error("Progress API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
