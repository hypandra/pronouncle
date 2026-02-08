/**
 * Audio utilities for text-to-speech and audio feedback.
 */

import type { TtsSpeed, TtsVoice } from "@/lib/tts/generate-audio"

// Tiny silent MP3 — used to unlock an HTMLAudioElement within a user gesture
// so that later (post-async) play() calls are allowed on iOS Safari.
const SILENT_MP3 =
  "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLmNvbQBURU5DAAAAHQAAA1NvZnR3YXJlAExhdmY1Ni40MC4xMDEAAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=="

// Singleton audio element, unlocked on first user gesture
let unlockedAudio: HTMLAudioElement | null = null

/**
 * Unlock audio playback on iOS Safari. Must be called synchronously
 * inside a user gesture handler (click/tap) BEFORE any async work.
 * Returns the unlocked HTMLAudioElement for reuse.
 */
export function unlockAudio(): HTMLAudioElement {
  if (!unlockedAudio) {
    unlockedAudio = new Audio()
  }
  unlockedAudio.src = SILENT_MP3
  unlockedAudio.play().catch(() => {})
  return unlockedAudio
}

// Check if speech synthesis is available
export function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

let currentAudio: HTMLAudioElement | null = null

function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisAvailable()) return []
  return window.speechSynthesis.getVoices()
}

function getChildFriendlyVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisAvailable()) return null

  const voices = getAvailableVoices()

  const femaleUSVoice = voices.find(
    (voice) =>
      voice.lang.startsWith("en-US") &&
      (voice.name.toLowerCase().includes("female") ||
        voice.name.toLowerCase().includes("samantha") ||
        voice.name.toLowerCase().includes("victoria"))
  )

  if (femaleUSVoice) return femaleUSVoice

  const usVoice = voices.find((voice) => voice.lang.startsWith("en-US"))
  if (usVoice) return usVoice

  const englishVoice = voices.find((voice) => voice.lang.startsWith("en"))
  if (englishVoice) return englishVoice

  return voices[0] || null
}

export function speak(
  text: string,
  options: {
    rate?: number
    pitch?: number
    volume?: number
    voice?: SpeechSynthesisVoice | null
    ttsVoice?: TtsVoice
    ttsSpeed?: TtsSpeed
    onEnd?: () => void
  } = {}
): void {
  if (typeof window === "undefined") return

  const playFallback = () => {
    if (!isSpeechSynthesisAvailable()) {
      console.warn("Speech synthesis not available")
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate ?? 0.9
    utterance.pitch = options.pitch ?? 1.1
    utterance.volume = options.volume ?? 1
    utterance.voice = options.voice ?? getChildFriendlyVoice()

    if (options.onEnd) {
      utterance.onend = options.onEnd
    }

    window.speechSynthesis.speak(utterance)
  }

  const playOpenTts = async () => {
    // Unlock audio element synchronously within the user gesture,
    // BEFORE any async work. iOS Safari expires the gesture budget
    // after the first await, so this must come first.
    const audio = unlockAudio()

    if (currentAudio && currentAudio !== audio) {
      currentAudio.pause()
      currentAudio.src = ""
    }
    currentAudio = audio

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: options.ttsVoice ?? "nova",
        speed: options.ttsSpeed ?? "normal",
      }),
    })

    if (!response.ok) {
      throw new Error("TTS request failed")
    }

    const audioBuffer = await response.arrayBuffer()
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" })
    const url = URL.createObjectURL(blob)

    // Reuse the already-unlocked element — iOS allows play() on it
    audio.onended = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
      options.onEnd?.()
    }

    audio.onerror = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
      options.onEnd?.()
    }

    audio.src = url
    await audio.play()
  }

  playOpenTts().catch((error) => {
    console.warn("OpenAI TTS failed, falling back to browser TTS:", error)
    playFallback()
  })
}
