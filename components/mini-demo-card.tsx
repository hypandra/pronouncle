"use client"

import { useState, useRef } from "react"
import { Mic, Square, Loader2, RotateCcw } from "lucide-react"

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, "").replace(/\s+/g, " ")
}

function doesSentenceContainWord(transcript: string, targetWord: string): boolean {
  const normalizedTranscript = normalizeText(transcript)
  const normalizedWord = normalizeText(targetWord)
  return normalizedTranscript.includes(normalizedWord)
}

type ButtonState = "ready" | "preparing" | "recording" | "processing" | "success" | "failure"

export function MiniDemoCard() {
  const [buttonState, setButtonState] = useState<ButtonState>("ready")
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState("")

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timeoutRef = useRef<number | null>(null)

  const targetWord = "coda"

  const transcribeAudio = async (audioBlob: Blob) => {
    setButtonState("processing")
    setError("")
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")
      const response = await fetch("/api/speech-to-text-demo", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Transcription failed.")
      }
      const spokenTranscript = (data?.text || "").trim()
      if (!spokenTranscript) {
        setError("No speech detected.")
        setButtonState("failure")
        return
      }
      setTranscript(spokenTranscript)
      const containsWord = doesSentenceContainWord(spokenTranscript, targetWord)
      setButtonState(containsWord ? "success" : "failure")
    } catch (err: any) {
      setError(err?.message || "Error processing audio.")
      setButtonState("failure")
    }
  }

  const startListening = async () => {
    if (buttonState === "preparing" || buttonState === "recording" || buttonState === "processing") return

    setButtonState("preparing")
    setTranscript("")
    setError("")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch {
      setButtonState("ready")
      setError("Microphone access required.")
      return
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : ""
    const recorder = new MediaRecorder(streamRef.current!, mimeType ? { mimeType } : undefined)
    recorderRef.current = recorder
    chunksRef.current = []

    recorder.onstart = () => setButtonState("recording")

    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) chunksRef.current.push(event.data)
    }

    recorder.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" })
      chunksRef.current = []
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      await transcribeAudio(audioBlob)
    }

    recorder.start()

    timeoutRef.current = window.setTimeout(() => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop()
      }
    }, 10000)
  }

  const stopListening = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop()
    }
  }

  const reset = () => {
    setButtonState("ready")
    setTranscript("")
    setError("")
  }

  const handleClick = () => {
    if (buttonState === "ready" || buttonState === "failure") {
      startListening()
    } else if (buttonState === "recording") {
      stopListening()
    }
  }

  return (
    <div className="bg-card shadow-soft-lg border border-rule p-6 space-y-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <span>Entry</span>
        <span>Try it</span>
      </div>
      <div className="border-b border-rule pb-4">
        <h2 className="text-3xl font-display text-ink">coda</h2>
        <p className="text-sm text-muted-foreground italic">noun</p>
        <p className="text-base text-ink mt-2">
          the concluding passage of a piece of music, usually forming an addition to the basic
          structure.
        </p>
      </div>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Read aloud</p>
        <p className="text-lg font-display text-ink">
          "The string quartet ended with a sudden, bright coda."
        </p>

        {/* Recording UI */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleClick}
            disabled={buttonState === "preparing" || buttonState === "processing"}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
              buttonState === "ready"
                ? "bg-success-green text-white hover:bg-success-green/90"
                : buttonState === "preparing" || buttonState === "processing"
                ? "bg-muted text-muted-foreground"
                : buttonState === "recording"
                ? "bg-accent-red text-white animate-pulse"
                : buttonState === "success"
                ? "bg-success-green/20 text-success-green"
                : "bg-accent-red/20 text-accent-red"
            }`}
          >
            {buttonState === "ready" && <Mic className="h-5 w-5" />}
            {buttonState === "preparing" && <Loader2 className="h-5 w-5 animate-spin" />}
            {buttonState === "recording" && <Square className="h-5 w-5" />}
            {buttonState === "processing" && <Loader2 className="h-5 w-5 animate-spin" />}
            {buttonState === "success" && <Mic className="h-5 w-5" />}
            {buttonState === "failure" && <Mic className="h-5 w-5" />}
          </button>

          <div className="flex-1">
            {buttonState === "ready" && (
              <p className="text-sm text-muted-foreground">Tap to record your sentence.</p>
            )}
            {buttonState === "preparing" && (
              <p className="text-sm text-muted-foreground">Connecting...</p>
            )}
            {buttonState === "recording" && (
              <p className="text-sm text-accent-red font-medium">Recording... tap to stop</p>
            )}
            {buttonState === "processing" && (
              <p className="text-sm text-muted-foreground">Checking...</p>
            )}
            {buttonState === "success" && (
              <p className="text-sm text-success-green font-semibold">
                Correct! You said "{targetWord}"
              </p>
            )}
            {buttonState === "failure" && !error && (
              <p className="text-sm text-accent-red font-medium">
                Try again — we didn't hear "{targetWord}"
              </p>
            )}
            {error && <p className="text-sm text-accent-red">{error}</p>}
          </div>

          {(buttonState === "success" || buttonState === "failure") && (
            <button
              onClick={reset}
              className="h-8 w-8 rounded-full border border-rule flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
              title="Try again"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <p className="text-sm text-muted-foreground italic border-t border-rule pt-3">
            You said: "{transcript}"
          </p>
        )}
      </div>
    </div>
  )
}
