import { NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { WORD_DATA } from "@/lib/word-data"
import { getCategoryBaseElo } from "@/lib/elo"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("word_elo")
      .select("word, category, current_elo, total_attempts, successful_attempts")
      .order("word")

    if (error) {
      console.error("Error fetching word elo:", error)
      return NextResponse.json({ error: "Failed to fetch words" }, { status: 500 })
    }

    const existingWords = new Set((data || []).map((word) => word.word))
    const missingWords = WORD_DATA.filter((word) => !existingWords.has(word.word))

    if (missingWords.length > 0) {
      const seedRows = missingWords.map((word) => {
        const baseElo = getCategoryBaseElo(word.category)
        return {
          word: word.word,
          category: word.category,
          base_elo: baseElo,
          current_elo: baseElo,
          total_attempts: 0,
          successful_attempts: 0,
        }
      })

      const adminClient = createAdminClient()
      if (adminClient) {
        const { error: seedError } = await adminClient
          .from("word_elo")
          .upsert(seedRows, { onConflict: "word" })
        if (seedError) {
          console.error("Error seeding word elo:", seedError)
        }
      }
    }

    const mergedWords = [
      ...(data || []),
      ...missingWords.map((word) => {
        const baseElo = getCategoryBaseElo(word.category)
        return {
          word: word.word,
          category: word.category,
          current_elo: baseElo,
          total_attempts: 0,
          successful_attempts: 0,
        }
      }),
    ].sort((a, b) => a.word.localeCompare(b.word))

    return NextResponse.json({ words: mergedWords })
  } catch (error) {
    console.error("Words API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
