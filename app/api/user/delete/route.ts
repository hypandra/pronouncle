import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/server"
import { pool } from "@/lib/db"

export const runtime = "nodejs"

export async function DELETE() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 })
    }

    const userId = session.user.id

    // Delete attempt history (Supabase table)
    await supabase.from("attempt_history").delete().eq("user_id", userId)

    // Delete user ELO (Supabase table)
    await supabase.from("user_elo").delete().eq("user_id", userId)

    // Delete pending word suggestions (Supabase table)
    await supabase.from("word_suggestions").delete().eq("created_by", userId)

    // Note: We intentionally keep word_catalog entries - approved community words
    // should remain available even if the contributor deletes their account

    // Delete Better Auth tables using pg pool (in pronouncle schema)
    await pool.query(`DELETE FROM pronouncle.sessions WHERE "userId" = $1`, [userId])
    await pool.query(`DELETE FROM pronouncle.accounts WHERE "userId" = $1`, [userId])

    const result = await pool.query(`DELETE FROM pronouncle.users WHERE id = $1`, [userId])

    if (result.rowCount === 0) {
      console.error("Failed to delete user: user not found")
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Account deletion error:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
