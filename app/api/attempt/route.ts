import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { calculateEloUpdate, getCategoryBaseElo } from "@/lib/elo"
import { WORD_DATA } from "@/lib/word-data"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, success, transcript } = body

    if (!word || typeof success !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: word, success" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get word Elo
    let { data: wordData } = await supabase
      .from("word_elo")
      .select("current_elo")
      .eq("word", word)
      .single()

    if (!wordData) {
      const wordInfo = WORD_DATA.find((entry) => entry.word === word)
      if (!wordInfo) {
        return NextResponse.json({ error: "Word not found" }, { status: 404 })
      }

      const baseElo = getCategoryBaseElo(wordInfo.category)
      const { data: seededWord, error: seedError } = await supabase
        .from("word_elo")
        .upsert(
          {
          word,
          category: wordInfo.category,
          base_elo: baseElo,
          current_elo: baseElo,
          total_attempts: 0,
          successful_attempts: 0,
        },
          { onConflict: "word" }
        )
        .select("current_elo")
        .single()

      if (seedError || !seededWord) {
        console.error("Error seeding word elo:", seedError)
        return NextResponse.json({ error: "Word not found" }, { status: 404 })
      }

      wordData = seededWord
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Authenticated user - full database update
    const userId = session.user.id

    // Get or create user Elo
    const { data: existingUser } = await supabase
      .from("user_elo")
      .select("elo_rating, total_attempts, successful_attempts")
      .eq("user_id", userId)
      .single()

    let userEloData = existingUser

    if (!userEloData) {
      // Create user_elo record
      const { data: newUser } = await supabase
        .from("user_elo")
        .insert({
          user_id: userId,
          elo_rating: 1500,
          total_attempts: 0,
          successful_attempts: 0,
        })
        .select()
        .single()
      userEloData = newUser
    }

    // Ensure we have user data (fallback to defaults if insert failed)
    const userElo = userEloData?.elo_rating ?? 1500
    const userAttempts = userEloData?.total_attempts ?? 0
    const userSuccesses = userEloData?.successful_attempts ?? 0

    // Calculate Elo update
    const update = calculateEloUpdate(userElo, wordData.current_elo, success)

    // Update user Elo
    await supabase
      .from("user_elo")
      .update({
        elo_rating: update.newUserElo,
        total_attempts: userAttempts + 1,
        successful_attempts: userSuccesses + (success ? 1 : 0),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    // Update word Elo
    const { data: currentWord } = await supabase
      .from("word_elo")
      .select("total_attempts, successful_attempts")
      .eq("word", word)
      .single()

    if (currentWord) {
      await supabase
        .from("word_elo")
        .update({
          current_elo: update.newWordElo,
          total_attempts: currentWord.total_attempts + 1,
          successful_attempts: currentWord.successful_attempts + (success ? 1 : 0),
          updated_at: new Date().toISOString(),
        })
        .eq("word", word)
    }

    // Record attempt history
    await supabase.from("attempt_history").insert({
      user_id: userId,
      word,
      success,
      user_elo_before: userElo,
      user_elo_after: update.newUserElo,
      word_elo_before: wordData.current_elo,
      word_elo_after: update.newWordElo,
      transcript,
    })

    return NextResponse.json({
      authenticated: true,
      newUserElo: update.newUserElo,
      userEloDelta: update.userEloDelta,
      newWordElo: update.newWordElo,
    })
  } catch (error) {
    console.error("Attempt API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
