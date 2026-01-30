import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Simple in-memory rate limiting: 10 requests per 15 minutes per IP
const rateLimitStore = new Map<string, number[]>()
const REQUESTS_LIMIT = 10
const TIME_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1"
  return ip
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const requests = rateLimitStore.get(ip) || []

  // Remove old requests outside the time window
  const recentRequests = requests.filter((time) => now - time < TIME_WINDOW_MS)

  if (recentRequests.length >= REQUESTS_LIMIT) {
    return false // Rate limited
  }

  // Add current request
  recentRequests.push(now)
  rateLimitStore.set(ip, recentRequests)

  return true // Not rate limited
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request)

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: "Demo limit reached. Sign up to unlock unlimited practice!" },
      { status: 429 }
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    )
  }

  const formData = await request.formData()
  const audioFile = formData.get("audio")
  if (!(audioFile instanceof File)) {
    return NextResponse.json({ error: "No audio file provided." }, { status: 400 })
  }

  const audioBuffer = await audioFile.arrayBuffer()
  const audioBlob = new Blob([audioBuffer], {
    type: audioFile.type || "audio/webm",
  })

  const openAiForm = new FormData()
  openAiForm.append("file", audioBlob, "recording.webm")
  openAiForm.append("model", "whisper-1")
  openAiForm.append("language", "en")
  openAiForm.append("response_format", "json")

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: openAiForm,
  })

  const data = await response.json()
  if (!response.ok) {
    const message = data?.error?.message || "OpenAI transcription failed."
    return NextResponse.json({ error: message }, { status: response.status })
  }

  return NextResponse.json({ text: data?.text || "" })
}
