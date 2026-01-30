"use client"

import { useState, useRef } from "react"
import { Volume2, Check, Copy, Loader2 } from "lucide-react"

const NEW_VARIATIONS = [
  // Option 1: Different phonetic hints
  "pruh-NOUN-sull",
  "pruh-nown-sul",
  "pra-noun-sul",
  "pruh nounce ul",
  // Option 2: Spelled out / respelled
  "pruh-nownsul",
  "pru-noun-suhl",
  "pruh-nounce-uhl",
]

const TTS_FILES = [
  {
    hash: "1e97223404e68bea48bd30f9eae07e114e57a3e864aa4794fa44a245e62587a4",
    text: "pronoun+sul",
    speed: "normal",
    voice: "nova",
  },
  {
    hash: "85b6c3fafb27abb84cd4ed79471c2a7d972ab7d708c938c786d5bd20c228b33d",
    text: "pruh+noun+sul",
    speed: "normal",
    voice: "nova",
  },
  {
    hash: "69f918487a10fb7693f13f318f949f2b58d28374f215568689c730e96d1b18a8",
    text: "pro+noun+sul",
    speed: "normal",
    voice: "nova",
  },
  {
    hash: "03d10a05a6cdef0e13557f364f0d8338b682cb5929d2c254abf1c65c772b32fc",
    text: "pruh+noun+suhl",
    speed: "normal",
    voice: "nova",
  },
  {
    hash: "d73b9182e85124763431376e003e567c9c46d1465aeacd6ba546671777ae0f82",
    text: "pronoun+suhl",
    speed: "normal",
    voice: "nova",
  },
  {
    hash: "12d3d8e910daacc661d054611503d4639b0048b810eccd320b95f70e96f4f790",
    text: "pruh-NOUN-sul",
    speed: "normal",
    voice: "nova",
  },
  // Unknown files
  {
    hash: "50f971b07a27a1d0c68004f841ba1ebcdd10c2ebb1888017b318fd3028f03a7b",
    text: "(unknown)",
    speed: "?",
    voice: "?",
  },
  {
    hash: "561dd9c8996ca63da923041891ccdae6109b00debe9d8b1921ba5ed2a70ade97",
    text: "(unknown)",
    speed: "?",
    voice: "?",
  },
  {
    hash: "a705d52d960fe3498adea0b36df1de422149c17ad9783aaa6caa8fcbf1a3bf04",
    text: "(unknown)",
    speed: "?",
    voice: "?",
  },
  {
    hash: "bb6bba141c7e1fda0d04b89a0b06c367207eca61efcef55e5f485d05f4187f4b",
    text: "(unknown)",
    speed: "?",
    voice: "?",
  },
]

const CDN_URL = process.env.NEXT_PUBLIC_BUNNY_CDN_URL || "https://pronouncle.b-cdn.net"

export default function TtsDebugPage() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [generatedUrls, setGeneratedUrls] = useState<Record<string, string>>({})
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const generateAndPlay = async (text: string, voice: string = "nova", speed: string = "normal") => {
    const key = `${text}|${voice}|${speed}`
    setGenerating(key)

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, speed }),
      })

      if (!res.ok) throw new Error("TTS failed")

      // Check if it's a redirect to CDN
      const finalUrl = res.url
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      setGeneratedUrls(prev => ({ ...prev, [key]: url }))

      // Play it
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(url)
      audioRef.current = audio
      setPlaying(key)
      audio.onended = () => setPlaying(null)
      audio.play()
    } catch (e) {
      console.error("Failed to generate TTS:", e)
    } finally {
      setGenerating(null)
    }
  }

  const playGenerated = (text: string, voice: string = "nova", speed: string = "normal") => {
    const key = `${text}|${voice}|${speed}`
    const url = generatedUrls[key]
    if (!url) return

    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(url)
    audioRef.current = audio
    setPlaying(key)
    audio.onended = () => setPlaying(null)
    audio.play()
  }

  const playAudio = (hash: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(`${CDN_URL}/tts/${hash}.mp3`)
    audioRef.current = audio
    setPlaying(hash)
    audio.onended = () => setPlaying(null)
    audio.onerror = () => setPlaying(null)
    audio.play()
  }

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopied(hash)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-cream text-ink p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-display mb-2">TTS Debug Panel</h1>
        <p className="text-muted-foreground mb-6">
          Listen to cached "pronouncle" pronunciations. Click to select your preferred one.
        </p>

        <div className="space-y-3">
          {TTS_FILES.map((file) => (
            <div
              key={file.hash}
              className={`border bg-card p-4 flex items-center gap-4 transition-colors ${
                selected === file.hash
                  ? "border-success-green bg-success-green/5"
                  : "border-rule hover:border-ink/30"
              }`}
            >
              <button
                onClick={() => playAudio(file.hash)}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                  playing === file.hash
                    ? "bg-accent-red text-white"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <Volume2 className="h-5 w-5" />
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold">{file.text}</p>
                <p className="text-xs text-muted-foreground">
                  voice: {file.voice} · speed: {file.speed}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {file.hash.slice(0, 20)}...
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyHash(file.hash)}
                  className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-ink"
                  title="Copy hash"
                >
                  {copied === file.hash ? (
                    <Check className="h-4 w-4 text-success-green" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setSelected(file.hash)}
                  className={`px-3 py-1 text-sm border transition-colors ${
                    selected === file.hash
                      ? "bg-success-green text-white border-success-green"
                      : "border-rule hover:border-ink"
                  }`}
                >
                  {selected === file.hash ? "Selected" : "Select"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="mt-8 p-4 border border-rule bg-card">
            <p className="text-sm font-semibold mb-2">Selected file:</p>
            <code className="block text-xs bg-muted p-2 font-mono break-all">
              {CDN_URL}/tts/{selected}.mp3
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Tell Claude which hash you selected and it will update the component.
            </p>
          </div>
        )}

        <div className="mt-12 border-t border-rule pt-8">
          <h2 className="text-2xl font-display mb-2">Generate New Variations</h2>
          <p className="text-muted-foreground mb-6">
            Click to generate and play. These will be cached in Bunny for future use.
          </p>

          <div className="space-y-3">
            {NEW_VARIATIONS.map((text) => {
              const key = `${text}|nova|normal`
              const isGenerating = generating === key
              const isPlaying = playing === key
              const hasGenerated = !!generatedUrls[key]

              return (
                <div
                  key={text}
                  className="border border-rule bg-card p-4 flex items-center gap-4"
                >
                  <button
                    onClick={() =>
                      hasGenerated
                        ? playGenerated(text)
                        : generateAndPlay(text)
                    }
                    disabled={isGenerating}
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                      isPlaying
                        ? "bg-accent-red text-white"
                        : isGenerating
                        ? "bg-muted"
                        : hasGenerated
                        ? "bg-success-green/20 text-success-green hover:bg-success-green/30"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </button>

                  <div className="flex-1">
                    <p className="font-mono text-sm font-semibold">{text}</p>
                    <p className="text-xs text-muted-foreground">
                      voice: nova · speed: normal
                      {hasGenerated && " · cached"}
                    </p>
                  </div>

                  {hasGenerated && (
                    <button
                      onClick={() => setSelected(text)}
                      className={`px-3 py-1 text-sm border transition-colors ${
                        selected === text
                          ? "bg-success-green text-white border-success-green"
                          : "border-rule hover:border-ink"
                      }`}
                    >
                      {selected === text ? "Selected" : "Select"}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {selected && !selected.includes("-") && (
          <div className="mt-8 p-4 border border-success-green bg-success-green/5">
            <p className="text-sm font-semibold mb-2">Selected new variation:</p>
            <code className="block text-sm bg-muted p-2 font-mono">
              {selected}
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Tell Claude this text and it will wire it into the component.
            </p>
          </div>
        )}

        <CustomVariationInput
          generating={generating}
          playing={playing}
          generatedUrls={generatedUrls}
          onGenerate={generateAndPlay}
          onPlay={playGenerated}
          onSelect={setSelected}
          selected={selected}
        />
      </div>
    </div>
  )
}

function CustomVariationInput({
  generating,
  playing,
  generatedUrls,
  onGenerate,
  onPlay,
  onSelect,
  selected,
}: {
  generating: string | null
  playing: string | null
  generatedUrls: Record<string, string>
  onGenerate: (text: string, voice?: string, speed?: string) => void
  onPlay: (text: string, voice?: string, speed?: string) => void
  onSelect: (text: string) => void
  selected: string | null
}) {
  const [customText, setCustomText] = useState("")
  const [customVoice, setCustomVoice] = useState("nova")

  const key = `${customText}|${customVoice}|normal`
  const isGenerating = generating === key
  const isPlaying = playing === key
  const hasGenerated = !!generatedUrls[key]

  return (
    <div className="mt-12 border-t border-rule pt-8">
      <h2 className="text-2xl font-display mb-2">Try Custom Text</h2>
      <p className="text-muted-foreground mb-4">
        Type any phonetic spelling to test.
      </p>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="e.g. pruh-NOWN-sul"
          className="flex-1 border border-rule bg-card px-3 py-2 text-sm font-mono"
        />
        <select
          value={customVoice}
          onChange={(e) => setCustomVoice(e.target.value)}
          className="border border-rule bg-card px-3 py-2 text-sm"
        >
          <option value="alloy">alloy</option>
          <option value="echo">echo</option>
          <option value="fable">fable</option>
          <option value="onyx">onyx</option>
          <option value="nova">nova</option>
          <option value="shimmer">shimmer</option>
        </select>
        <button
          onClick={() =>
            hasGenerated
              ? onPlay(customText, customVoice)
              : onGenerate(customText, customVoice)
          }
          disabled={!customText || isGenerating}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            isGenerating
              ? "bg-muted text-muted-foreground"
              : isPlaying
              ? "bg-accent-red text-white"
              : "bg-success-green text-white hover:bg-success-green/90"
          }`}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasGenerated ? (
            "Play"
          ) : (
            "Generate"
          )}
        </button>
      </div>

      {hasGenerated && (
        <button
          onClick={() => onSelect(customText)}
          className={`px-4 py-2 text-sm border transition-colors ${
            selected === customText
              ? "bg-success-green text-white border-success-green"
              : "border-rule hover:border-ink"
          }`}
        >
          {selected === customText ? "Selected!" : "Select this one"}
        </button>
      )}
    </div>
  )
}
