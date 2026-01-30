import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { generateTtsAudio, TTS_MODEL } from "@/lib/tts/generate-audio"

export const runtime = "nodejs"

type TtsPayload = {
  text?: string
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
  speed?: "slow" | "normal" | "fast"
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TtsPayload
    const input = body.text

    if (!input) {
      return NextResponse.json({ error: "text is required" }, { status: 400 })
    }

    const voice = body.voice ?? "alloy"
    const speed = body.speed ?? "normal"
    const zone = process.env.BUNNY_STORAGE_ZONE
    const apiKey = process.env.BUNNY_STORAGE_API_KEY
    const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL

    const cacheKey = createHash("sha256")
      .update(`${TTS_MODEL}|${voice}|${speed}|${input}`)
      .digest("hex")
    const objectPath = `tts/${cacheKey}.mp3`

    const missingEnv: string[] = []
    if (!zone) missingEnv.push("BUNNY_STORAGE_ZONE")
    if (!apiKey) missingEnv.push("BUNNY_STORAGE_API_KEY")
    if (!cdnUrl) missingEnv.push("NEXT_PUBLIC_BUNNY_CDN_URL")

    if (missingEnv.length > 0) {
      console.info(
        `TTS cache: missing env (${missingEnv.join(", ")}). Using OpenAI TTS only.`
      )
    }

    if (zone && apiKey) {
      const storageUrl = `https://storage.bunnycdn.com/${zone}/${objectPath}`
      // Use GET instead of HEAD - Bunny returns 401 for HEAD requests
      const cachedResponse = await fetch(storageUrl, {
        headers: { AccessKey: apiKey },
      })

      if (cachedResponse.ok) {
        if (cdnUrl) {
          console.info("TTS cache: HIT (Bunny CDN)")
          return NextResponse.redirect(`${cdnUrl}/${objectPath}`, 307)
        }
        console.info("TTS cache: HIT (Bunny storage)")
        const cachedBuffer = await cachedResponse.arrayBuffer()
        return new NextResponse(new Uint8Array(cachedBuffer), {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "X-TTS-Model": TTS_MODEL,
          },
        })
      }
    }

    console.info("TTS cache: MISS (generating audio)")
    const audioBuffer = await generateTtsAudio(input, voice, speed)
    const audioBytes = new Uint8Array(audioBuffer)

    if (zone && apiKey) {
      const storageUrl = `https://storage.bunnycdn.com/${zone}/${objectPath}`
      const uploadBody = new Uint8Array(audioBuffer)
      const uploadResponse = await fetch(storageUrl, {
        method: "PUT",
        headers: {
          AccessKey: apiKey,
          "Content-Type": "audio/mpeg",
        },
        body: audioBytes,
      })

      if (!uploadResponse.ok) {
        console.warn("Bunny TTS upload failed:", await uploadResponse.text())
      }
    }

    return new NextResponse(audioBytes, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "X-TTS-Model": TTS_MODEL,
      },
    })
  } catch (error) {
    console.error("TTS error:", error)
    return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 })
  }
}
