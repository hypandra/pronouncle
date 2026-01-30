/**
 * Seed word_elo table from WORD_DATA with category-based Elo ratings
 * Run with: bun run scripts/seed-word-elo.ts
 */

import { createClient } from "@supabase/supabase-js"
import { WORD_DATA } from "../lib/word-data"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Category to base Elo mapping
const CATEGORY_ELO: Record<string, number> = {
  "First Grade": 1200,
  "Third Grade": 1400,
  "Fifth Grade": 1500,
  "Seventh Grade": 1600,
  "Ninth Grade": 1800,
  "SAT Style": 1800,
  "Medical": 1700,
  "Law Enforcement & Legal": 1700,
  "Church & Religious": 1700,
  "Linguistic Curiosities": 1700,
  "Bonus: Slang Words": 1500,
}

async function seedWordElo() {
  console.log("Seeding word_elo table...")

  const wordEloData = WORD_DATA.map((item) => {
    const baseElo = CATEGORY_ELO[item.category] || 1500
    return {
      word: item.word,
      category: item.category,
      base_elo: baseElo,
      current_elo: baseElo,
      total_attempts: 0,
      successful_attempts: 0,
    }
  })

  console.log(`Preparing ${wordEloData.length} words...`)

  // Upsert in batches (Supabase has limits)
  const batchSize = 50
  for (let i = 0; i < wordEloData.length; i += batchSize) {
    const batch = wordEloData.slice(i, i + batchSize)

    const { error } = await supabase
      .from("word_elo")
      .upsert(batch, { onConflict: "word" })

    if (error) {
      console.error(`Error upserting batch ${i / batchSize + 1}:`, error)
    } else {
      console.log(`Upserted batch ${i / batchSize + 1} (${batch.length} words)`)
    }
  }

  // Verify
  const { count, error: countError } = await supabase
    .from("word_elo")
    .select("*", { count: "exact", head: true })

  if (countError) {
    console.error("Error counting:", countError)
  } else {
    console.log(`\nTotal words in word_elo: ${count}`)
  }

  // Show distribution
  const { data: distribution } = await supabase
    .from("word_elo")
    .select("category, base_elo")

  if (distribution) {
    const byCategory = distribution.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = { count: 0, elo: row.base_elo }
      }
      acc[row.category].count++
      return acc
    }, {} as Record<string, { count: number; elo: number }>)

    console.log("\nDistribution by category:")
    Object.entries(byCategory)
      .sort((a, b) => a[1].elo - b[1].elo)
      .forEach(([cat, { count, elo }]) => {
        console.log(`  ${cat}: ${count} words @ Elo ${elo}`)
      })
  }
}

seedWordElo()
  .then(() => {
    console.log("\nDone!")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Fatal error:", err)
    process.exit(1)
  })
