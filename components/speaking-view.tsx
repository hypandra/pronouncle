"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Volume2, Mic, Shuffle, Square, Loader2, ArrowRight, Share2, Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { speak } from "@/lib/audio"
import { WORD_DATA } from "@/lib/word-data"
import { PronouncleHeader } from "./pronouncle-header"
import { useProgress } from "@/contexts/progress-context"
import { useSession } from "@/lib/auth-client"

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
}

function doesSentenceContainWord(transcript: string, targetWord: string): boolean {
  const normalizedTranscript = normalizeText(transcript)
  const normalizedWord = normalizeText(targetWord)
  return normalizedTranscript.includes(normalizedWord)
}

type ButtonState = 'ready' | 'preparing' | 'recording' | 'processing' | 'result'

type CommunityWordData = {
  word: string
  stubDefinition: string
  exampleSentence: string
  category: string
}

interface SpeakingViewProps {
  currentWordIndex: number
  communityWord?: CommunityWordData
  onChangeWord: () => void
  onBackToList: () => void
  onNextWord: (nextIndex: number) => void
  onAttemptResult?: (success: boolean, transcript?: string) => Promise<number | null>
  isAdaptiveMode?: boolean
}

export function SpeakingView({
  currentWordIndex,
  communityWord,
  onChangeWord,
  onBackToList,
  onNextWord,
  onAttemptResult,
  isAdaptiveMode,
}: SpeakingViewProps) {
  const [isListening, setIsListening] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [result, setResult] = useState<'success' | 'failure' | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingSupported, setRecordingSupported] = useState(true)
  const [ipa, setIpa] = useState<string[] | null>(null)
  const [hasMoreVariants, setHasMoreVariants] = useState(false)
  const [lastDelta, setLastDelta] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const { progress, percentile } = useProgress()
  const { data: session, isPending } = useSession()
  const isAuthenticated = !!session?.user
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timeoutRef = useRef<number | null>(null)

  // Support both static WORD_DATA and community words
  const currentItem = communityWord
    ? { word: communityWord.word, definition: communityWord.stubDefinition, sentence: communityWord.exampleSentence, category: communityWord.category }
    : WORD_DATA[currentWordIndex]
  const currentWord = currentItem.word

  // Compute button state
  const getButtonState = (): ButtonState => {
    if (isTranscribing) return 'processing'
    if (isListening) return 'recording'
    if (isPreparing) return 'preparing'
    if (result === 'success') return 'result'  // Only disable on success
    return 'ready'  // Allow re-recording on failure or initial state
  }
  const buttonState = getButtonState()

  // Handle next word - memoized to avoid useEffect dependency issues
  const handleNextWord = useCallback(() => {
    // Reset local state for the new word
    setResult(null)
    setTranscript('')
    setError('')
    setLastDelta(null)
    // For community words, let the parent handle navigation
    const nextIndex = communityWord ? -1 : (currentWordIndex + 1) % WORD_DATA.length
    onNextWord(nextIndex)
  }, [currentWordIndex, communityWord, onNextWord])

  const handleChangeWord = useCallback(() => {
    setResult(null)
    setTranscript('')
    setError('')
    setLastDelta(null)
    onChangeWord()
  }, [onChangeWord])

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingSupported(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || isPending) {
      setIpa([])
      setHasMoreVariants(false)
      return
    }

    fetch(`/api/ipa?word=${encodeURIComponent(currentWord)}`)
      .then(r => r.json())
      .then(data => {
        setIpa(data.ipa || [])
        setHasMoreVariants(data.hasMoreVariants || false)
      })
      .catch(() => {
        setIpa([])
        setHasMoreVariants(false)
      })
  }, [currentWord, isAuthenticated, isPending])

  // Keyboard handler for all actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in a dialog or typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (result === 'success' && (e.key === 'Enter' || e.key === 'ArrowRight')) {
        e.preventDefault()
        handleNextWord()
      } else if (buttonState === 'ready' && e.key === ' ') {
        e.preventDefault()
        startListening()
      } else if (buttonState === 'recording' && e.key === ' ') {
        e.preventDefault()
        stopListening()
      } else if (e.key === 'p' && result) {
        e.preventDefault()
        playWord()
      } else if (e.key === 's' && isAuthenticated) {
        e.preventDefault()
        handleChangeWord()
      } else if (e.key === 'Escape' && isAuthenticated) {
        e.preventDefault()
        onBackToList()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [result, buttonState, handleNextWord, handleChangeWord, onBackToList, isAuthenticated])

  const playWord = () => {
    speak(currentWord, { rate: 0.8 })
  }

  const shareWord = async () => {
    const url = `${window.location.origin}/words/${encodeURIComponent(currentWord)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")
      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sign in to use voice practice.")
        }
        throw new Error(data?.error || "Transcription failed.")
      }
      const spokenTranscript = (data?.text || "").trim()
      if (!spokenTranscript) {
        setError("No speech detected. Please speak clearly into your microphone.")
        setResult("failure")
        return
      }
      setTranscript(spokenTranscript)
      const containsWord = doesSentenceContainWord(spokenTranscript, currentWord)
      setResult(containsWord ? "success" : "failure")
      // Record the attempt result for Elo tracking
      if (onAttemptResult) {
        const delta = await onAttemptResult(containsWord, spokenTranscript)
        setLastDelta(delta ?? 0)
      }
      // No auto-advance - user controls pace with Next Word button
    } catch (transcriptionError: any) {
      setError(transcriptionError?.message || "Transcription error. Please try again.")
      setResult("failure")
    } finally {
      setIsTranscribing(false)
    }
  }

  const startListening = async () => {
    if (!recordingSupported || isTranscribing || isPreparing) return

    // Immediate feedback
    setIsPreparing(true)
    setResult(null)
    setTranscript('')
    setError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch (permissionError) {
      setIsPreparing(false)
      setError("Microphone permission required. Please allow microphone access in your browser settings.")
      return
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : ""
    const recorder = new MediaRecorder(streamRef.current!, mimeType ? { mimeType } : undefined)
    recorderRef.current = recorder
    chunksRef.current = []

    recorder.onstart = () => {
      setIsPreparing(false)
      setIsListening(true)
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    recorder.onstop = async () => {
      setIsListening(false)
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

  return (
    <div>
      <div className="max-w-2xl mx-auto px-6 py-4 lg:py-2">
        <PronouncleHeader
          showScore={result !== null && isAuthenticated}
          score={progress.elo}
          delta={lastDelta}
        />

        {/* Word Display */}
        <section className="text-center py-4 lg:py-2 border-b border-rule">
          <h2 className="text-4xl md:text-5xl font-display font-semibold text-ink">
            {currentWord}
          </h2>
          <p className="text-lg text-muted-foreground italic mt-2">
            {currentItem.definition}
          </p>
        </section>

        {/* Sentence Card */}
        <section className="py-4 lg:py-2 text-center bg-card shadow-soft">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Read Aloud
          </p>
          <p className="text-xl font-display text-ink px-4 leading-relaxed">
            "{currentItem.sentence}"
          </p>

          {/* Record Button */}
          <div className="mt-4 lg:mt-2">
            {recordingSupported ? (
              <div className="flex flex-col items-center">
                <button
                  onClick={buttonState === 'ready' ? startListening : buttonState === 'recording' ? stopListening : undefined}
                  disabled={buttonState === 'processing' || buttonState === 'result' || buttonState === 'preparing'}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-red ${
                    buttonState === 'ready'
                      ? 'bg-success-green text-white hover:bg-success-green/90 cursor-pointer'
                      : buttonState === 'preparing'
                      ? 'bg-success-green/70 text-white cursor-wait'
                      : buttonState === 'recording'
                      ? 'bg-accent-red text-white animate-pulse-record cursor-pointer'
                      : buttonState === 'processing'
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  aria-label={
                    buttonState === 'ready' ? (result === 'failure' ? 'Press Space to try again' : 'Press Space to record') :
                    buttonState === 'preparing' ? 'Connecting to microphone' :
                    buttonState === 'recording' ? 'Press Space to stop' :
                    buttonState === 'processing' ? 'Processing' :
                    'Recording complete'
                  }
                >
                  {buttonState === 'ready' && <Mic className="h-7 w-7" />}
                  {buttonState === 'preparing' && <Loader2 className="h-6 w-6 animate-spin" />}
                  {buttonState === 'recording' && <Square className="h-6 w-6" />}
                  {buttonState === 'processing' && <Loader2 className="h-6 w-6 animate-spin" />}
                  {buttonState === 'result' && <Mic className="h-6 w-6" />}
                </button>
                <p className="text-sm text-muted-foreground mt-2">
                  {buttonState === 'ready' && (result === 'failure' ? 'Press Space to try again' : 'Press Space or tap to record')}
                  {buttonState === 'preparing' && 'Connecting...'}
                  {buttonState === 'recording' && 'Press Space or tap to stop'}
                  {buttonState === 'processing' && 'Processing...'}
                  {buttonState === 'result' && 'Recording complete'}
                </p>
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-muted-foreground font-medium mb-1">Voice recording not supported</p>
                <p className="text-sm text-muted-foreground">
                  Try Chrome, Edge, or Safari.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Transcript Display */}
        {transcript && (
          <div className="border-b border-rule py-3 lg:py-2 animate-fade-in">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">You said:</p>
            <p className="text-base text-ink italic">"{transcript}"</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="border-b border-rule py-3 lg:py-2 animate-fade-in">
            <p className="text-accent-red font-medium mb-1">Error</p>
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <Button
              onClick={() => setError('')}
              variant="outline"
              size="sm"
              className="text-accent-red border-accent-red/30 hover:bg-accent-red/10"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Result */}
        {result && !error && (
          <div className="border-b border-rule py-4 lg:py-2 text-center animate-fade-in">
            <p className={`text-2xl font-display font-semibold ${
              result === 'success' ? 'text-success-green' : 'text-accent-red'
            }`}>
              {result === 'success' ? 'Correct!' : 'Try Again'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {result === 'success'
                ? 'Press Enter or → to continue'
                : 'Press Space to try again'}
            </p>
            {isAuthenticated && (
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
                Score {typeof percentile === "number" ? percentile : "—"}
              </p>
            )}
          </div>
        )}

        {!isAuthenticated && !isPending && (
          <div className="border border-rule bg-card/50 py-3 px-4 my-3 animate-fade-in">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Guest Mode</p>
            <p className="text-sm text-muted-foreground">
              Practice this word without an account.{' '}
              <Link href="/signin" className="text-ink hover:underline">
                Sign in
              </Link>{' '}
              to save your progress.
            </p>
          </div>
        )}

        {/* IPA Reveal - shown after result */}
        {result && ipa && ipa.length > 0 && (
          <div className="border-b border-rule py-3 lg:py-2 animate-fade-in">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Pronunciation{ipa.length > 1 && 's'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {ipa.map((pronunciation, i) => (
                <span key={i} className="font-mono text-ink text-base">
                  /{pronunciation}/
                  {i < ipa.length - 1 && <span className="text-muted-foreground ml-2">or</span>}
                </span>
              ))}
            </div>
            {hasMoreVariants && (
              <p className="text-xs text-muted-foreground mt-1">More variants available on Wiktionary</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="py-4 lg:py-2 space-y-3 lg:space-y-2">
          {/* Next Word Button - only on success */}
          {result === 'success' && (
            <button
              onClick={handleNextWord}
              className="w-full h-12 lg:h-10 bg-success-green text-white font-semibold flex items-center justify-center gap-2 hover:bg-success-green/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-green"
            >
              Next Word
              <ArrowRight className="h-5 w-5" />
              <span className="text-xs opacity-75 ml-1">(Enter)</span>
            </button>
          )}

          {/* Hear it button */}
          {result && (
            <button
              onClick={playWord}
              className="w-full h-10 lg:h-9 border border-rule text-ink font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-red"
            >
              <Volume2 className="h-4 w-4" />
              Hear Pronunciation
              <span className="text-xs text-muted-foreground ml-1">(P)</span>
            </button>
          )}

          {/* Secondary actions */}
          <div className="flex gap-3">
            {isAuthenticated && (
              <>
                <button
                  onClick={onBackToList}
                  className="flex-1 h-10 lg:h-9 border border-rule text-muted-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-red"
                >
                  Back
                  <span className="text-xs opacity-60">(Esc)</span>
                </button>
                <button
                  onClick={handleChangeWord}
                  className="flex-1 h-10 lg:h-9 border border-rule text-muted-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-red"
                >
                  <Shuffle className="h-4 w-4" />
                  Skip
                  <span className="text-xs opacity-60">(S)</span>
                </button>
              </>
            )}
            <button
              onClick={shareWord}
              className={`${isAuthenticated ? '' : 'flex-1'} h-10 lg:h-9 border border-rule text-muted-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-red px-4`}
            >
              {copied ? <Check className="h-4 w-4 text-success-green" /> : <Share2 className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
