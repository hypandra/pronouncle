import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { CATEGORY_ELO, getCategoryBaseElo } from "@/lib/elo"
import { WORD_DATA } from "@/lib/word-data"

export const runtime = "nodejs"

type WordSuggestionInput = {
  word?: string
  userDefinition?: string
  userSentence?: string
}

type JudgeResult = {
  decision: "approved" | "rejected" | "revise"
  reason: string
  cleaned_word: string
  category: string
  difficulty: number
  definitions: string[]
  sentences: string[]
  use_user_definition: boolean
  use_user_sentence: boolean
}

const DEFAULT_JUDGE_MODEL = "gpt-4o-mini"

function normalizeText(value: string | undefined | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function isDuplicateWord(word: string) {
  const lower = word.toLowerCase()
  return WORD_DATA.some((entry) => entry.word.toLowerCase() === lower)
}

async function runWordJudge(payload: {
  word: string
  userDefinition: string | null
  userSentence: string | null
}): Promise<JudgeResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY")
  }

  const model = process.env.OPENAI_JUDGE_MODEL || DEFAULT_JUDGE_MODEL
  const categories = Object.keys(CATEGORY_ELO)

  const systemPrompt = [
    "You are a strict vocabulary curator for a pronunciation practice app.",
    "Decide whether a proposed word should be added.",
    "Reject profanity, slurs, explicit content, and nonsense or misspelled words.",
    "Allow proper nouns and multi-word terms when reasonable.",
    "Return JSON only with the specified keys.",
    "Definitions and sentences must be concise, neutral, and suitable for learners.",
  ].join(" ")

  const userPrompt = [
    `Word: ${payload.word}`,
    payload.userDefinition ? `User definition: ${payload.userDefinition}` : "User definition: (none)",
    payload.userSentence ? `User sentence: ${payload.userSentence}` : "User sentence: (none)",
    `Allowed categories: ${categories.join(", ")}`,
    "Return JSON with keys:",
    "decision (approved|rejected|revise), reason, cleaned_word, category, difficulty (0-1),",
    "definitions (2 items), sentences (2 items), use_user_definition (boolean), use_user_sentence (boolean).",
  ].join("\n")

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    const message = data?.error?.message || "Word judge failed."
    throw new Error(message)
  }

  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("Word judge returned no content.")
  }

  return JSON.parse(content) as JudgeResult
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const isDebugAllowed =
      process.env.ALLOW_DEBUG_WORD_SUGGESTIONS === "true" &&
      process.env.NODE_ENV !== "production"
    const debugUserId = request.headers.get("x-debug-user-id")
    const userId = session?.user?.id ?? (isDebugAllowed ? debugUserId : null)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as WordSuggestionInput
    const word = normalizeText(body.word)
    const userDefinition = normalizeText(body.userDefinition)
    const userSentence = normalizeText(body.userSentence)

    if (!word) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 })
    }

    if (word.length > 64) {
      return NextResponse.json({ error: "Word is too long" }, { status: 400 })
    }

    const wordLower = word.toLowerCase()

    if (isDuplicateWord(word)) {
      return NextResponse.json({ error: "Word already exists" }, { status: 409 })
    }

    const adminClient = createAdminClient()
    const supabase = adminClient ?? (await createClient())

    const { data: existingWord } = await supabase
      .from("word_catalog")
      .select("word")
      .eq("word_lower", wordLower)
      .maybeSingle()

    if (existingWord) {
      return NextResponse.json({ error: "Word already exists" }, { status: 409 })
    }

    const judge = await runWordJudge({ word, userDefinition, userSentence })

    const recommendations = {
      definitions: judge.definitions,
      sentences: judge.sentences,
      category: judge.category,
      difficulty: judge.difficulty,
      use_user_definition: judge.use_user_definition,
      use_user_sentence: judge.use_user_sentence,
      cleaned_word: judge.cleaned_word,
    }

    const { data: suggestion, error: suggestionError } = await supabase
      .from("word_suggestions")
      .insert({
        word,
        user_definition: userDefinition,
        user_sentence: userSentence,
        llm_decision: judge.decision,
        llm_feedback: judge.reason,
        llm_recommendations: recommendations,
        created_by: userId,
        decided_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (suggestionError) {
      console.error("Failed to save word suggestion:", suggestionError)
      return NextResponse.json({ error: "Failed to save suggestion" }, { status: 500 })
    }

    if (judge.decision === "approved") {
      const approvedDefinition =
        judge.use_user_definition && userDefinition ? userDefinition : judge.definitions[0]
      const approvedSentence =
        judge.use_user_sentence && userSentence ? userSentence : judge.sentences[0]
      const baseElo = getCategoryBaseElo(judge.category)

      const { error: catalogError } = await supabase.from("word_catalog").upsert(
        {
          word: judge.cleaned_word || word,
          definition: approvedDefinition,
          sentence: approvedSentence,
          category: judge.category,
          source: "community",
          status: "approved",
          created_by: userId,
        },
        { onConflict: "word_lower" }
      )

      if (catalogError) {
        console.error("Failed to upsert word catalog:", catalogError)
      }

      const { error: eloError } = await supabase.from("word_elo").upsert(
        {
          word: judge.cleaned_word || word,
          category: judge.category,
          base_elo: baseElo,
          current_elo: baseElo,
          total_attempts: 0,
          successful_attempts: 0,
        },
        { onConflict: "word" }
      )

      if (eloError) {
        console.error("Failed to seed word elo:", eloError)
      }
    }

    return NextResponse.json({
      id: suggestion.id,
      decision: judge.decision,
      reason: judge.reason,
      recommendations,
    })
  } catch (error) {
    console.error("Word suggestion error:", error)
    return NextResponse.json({ error: "Failed to judge suggestion" }, { status: 500 })
  }
}
