/**
 * Audio utilities for text-to-speech and audio feedback.
 */

import type { TtsSpeed, TtsVoice } from "@/lib/tts/generate-audio"

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
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ""
      currentAudio = null
    }

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
    const audio = new Audio(url)
    currentAudio = audio

    audio.onended = () => {
      URL.revokeObjectURL(url)
      currentAudio = null
      options.onEnd?.()
    }

    audio.onerror = () => {
      URL.revokeObjectURL(url)
      currentAudio = null
      options.onEnd?.()
    }

    await audio.play()
  }

  playOpenTts().catch((error) => {
    console.warn("OpenAI TTS failed, falling back to browser TTS:", error)
    playFallback()
  })
}
