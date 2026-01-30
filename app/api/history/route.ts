import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("attempt_history")
      .select("word, success, transcript, created_at, user_elo_before, user_elo_after, word_elo_before")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) {
      console.error("History API error:", error)
      return NextResponse.json({ error: "Failed to load history" }, { status: 500 })
    }

    const wordStats: Record<string, { successes: number; failures: number }> = {}

    for (const attempt of data || []) {
      const stats = wordStats[attempt.word] || { successes: 0, failures: 0 }
      if (attempt.success) {
        stats.successes += 1
      } else {
        stats.failures += 1
      }
      wordStats[attempt.word] = stats
    }

    const attempts = (data || []).map((attempt) => ({
      word: attempt.word,
      correct: attempt.success,
      wordElo: attempt.word_elo_before ?? 1500,
      userEloBefore: attempt.user_elo_before ?? 1500,
      userEloAfter: attempt.user_elo_after ?? 1500,
      transcript: attempt.transcript || undefined,
      timestamp: attempt.created_at,
    }))

    return NextResponse.json({
      authenticated: true,
      attempts,
      wordStats,
    })
  } catch (error) {
    console.error("History API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
