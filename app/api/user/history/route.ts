import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/server"

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

    // Delete all attempt history
    const { error: historyError } = await supabase
      .from("attempt_history")
      .delete()
      .eq("user_id", session.user.id)

    if (historyError) {
      console.error("Failed to delete history:", historyError)
      return NextResponse.json({ error: "Failed to reset history" }, { status: 500 })
    }

    // Reset user ELO to default
    const { error: eloError } = await supabase
      .from("user_elo")
      .update({
        elo_rating: 1500,
        total_attempts: 0,
        successful_attempts: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id)

    if (eloError) {
      console.error("Failed to reset ELO:", eloError)
      // Don't fail the request - history was deleted successfully
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("History reset error:", error)
    return NextResponse.json({ error: "Failed to reset history" }, { status: 500 })
  }
}
