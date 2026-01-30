import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"

export const runtime = "nodejs"

type ProfilePayload = {
  name?: string
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as ProfilePayload
    const name = body.name?.trim()

    if (!name || name.length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 })
    }

    // Use pg pool directly for Better Auth user table (in pronouncle schema)
    const result = await pool.query(
      `UPDATE pronouncle.users SET name = $1, "updatedAt" = NOW() WHERE id = $2`,
      [name, session.user.id]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, name })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
