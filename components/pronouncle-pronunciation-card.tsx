"use client"

import { useState } from "react"
import { Volume2 } from "lucide-react"
import { unlockAudio } from "@/lib/audio"

const PRONOUNCLE_AUDIO_URL =
  "https://pronouncle.b-cdn.net/tts/539a6eeb2d764b65a76bbd3c988831ff64b96dfec6a047b26fe1df9800961a5a.mp3"

export function PronounclePronunciationCard() {
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = () => {
    if (isPlaying) return
    setIsPlaying(true)

    // Unlock audio within user gesture, then reuse the element
    const audio = unlockAudio()
    audio.onended = () => setIsPlaying(false)
    audio.onerror = () => setIsPlaying(false)
    audio.src = PRONOUNCLE_AUDIO_URL
    audio.play().catch(() => setIsPlaying(false))
  }

  return (
    <div className="border border-rule bg-card px-5 py-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">How do I pronounce Pronouncle?</p>
          <p className="text-sm text-muted-foreground mt-1">
            Pronouncle is said like{" "}
            <span className="font-mono text-ink">pruh-NOUN-sul</span>.
          </p>
        </div>
        <button
          onClick={handlePlay}
          className="inline-flex items-center justify-center h-10 px-4 border border-rule text-ink text-sm font-semibold hover:bg-muted/60 transition-colors"
          aria-label="Play Pronouncle pronunciation"
        >
          <Volume2 className="h-4 w-4 mr-2" />
          {isPlaying ? "Playing..." : "Hear it"}
        </button>
      </div>
      <div className="border-t border-rule mt-4 pt-4">
        <p className="text-sm text-ink leading-relaxed">
          To disentangle the spelling of a word from its sound; the act of solving a word puzzle
          using phonemes, stress patterns, and rhymes rather than just letters{" "}
          <span className="text-muted-foreground">(see also: phonics, orthography)</span>.
        </p>
        <p className="text-sm text-muted-foreground mt-3 italic">
          "I <span className="font-semibold text-ink">pronouncled</span> 'chaos' on my first try
          because I remembered the rule: Greek words turn 'CH' into 'K'!"
        </p>
      </div>
    </div>
  )
}
