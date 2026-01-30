"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, XCircle, AlertCircle, Play } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type Decision = "approved" | "rejected" | "revise"

type SuggestionResult = {
  id: string
  decision: Decision
  reason: string
  recommendations: {
    definitions: string[]
    sentences: string[]
    category: string
    difficulty: number
    use_user_definition: boolean
    use_user_sentence: boolean
    cleaned_word: string
  }
}

interface SuggestWordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuggestWordDialog({ open, onOpenChange }: SuggestWordDialogProps) {
  const router = useRouter()
  const [word, setWord] = useState("")
  const [userDefinition, setUserDefinition] = useState("")
  const [userSentence, setUserSentence] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<SuggestionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setWord("")
    setUserDefinition("")
    setUserSentence("")
    setResult(null)
    setError(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!word.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/word-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: word.trim(),
          userDefinition: userDefinition.trim() || undefined,
          userSentence: userSentence.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to submit suggestion")
        return
      }

      setResult(data)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTryAnother = () => {
    resetForm()
  }

  const handlePracticeNow = () => {
    if (!result) return
    const practiceWord = result.recommendations.cleaned_word || word
    onOpenChange(false)
    resetForm()
    router.push(`/words/${encodeURIComponent(practiceWord)}`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-ink">
            Suggest a Word
          </DialogTitle>
          <DialogDescription>
            Suggest a word to add to Pronouncle. Your suggestion will be reviewed automatically.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label htmlFor="word" className="block text-sm font-medium text-ink mb-1">
                Word <span className="text-accent-red">*</span>
              </label>
              <input
                id="word"
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g., petrichor"
                className="w-full px-3 py-2 border border-rule bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:border-ink transition-colors"
                disabled={isSubmitting}
                maxLength={64}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="definition" className="block text-sm font-medium text-ink mb-1">
                Definition <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="definition"
                type="text"
                value={userDefinition}
                onChange={(e) => setUserDefinition(e.target.value)}
                placeholder="A brief definition"
                className="w-full px-3 py-2 border border-rule bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:border-ink transition-colors"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="sentence" className="block text-sm font-medium text-ink mb-1">
                Example sentence <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="sentence"
                type="text"
                value={userSentence}
                onChange={(e) => setUserSentence(e.target.value)}
                placeholder="A sentence using the word"
                className="w-full px-3 py-2 border border-rule bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:border-ink transition-colors"
                disabled={isSubmitting}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              This suggestion will be linked to your account.
            </p>

            {error && (
              <div className="flex items-center gap-2 text-sm text-accent-red">
                <XCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!word.trim() || isSubmitting}
              className="w-full h-10 px-4 bg-ink text-cream font-medium flex items-center justify-center gap-2 hover:bg-ink/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reviewing...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            {result.decision === "approved" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success-green">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Word added!</span>
                </div>
                <p className="text-sm text-muted-foreground">{result.reason}</p>
                <div className="border border-rule p-3 space-y-2">
                  <p className="text-lg font-display font-semibold text-ink">
                    {result.recommendations.cleaned_word || word}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.recommendations.definitions[0]}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    "{result.recommendations.sentences[0]}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Category: {result.recommendations.category}
                  </p>
                </div>
                <button
                  onClick={handlePracticeNow}
                  className="w-full h-10 px-4 bg-success-green text-white font-medium flex items-center justify-center gap-2 hover:bg-success-green/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-green"
                >
                  <Play className="h-4 w-4" />
                  Practice now
                </button>
              </div>
            )}

            {result.decision === "rejected" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-accent-red">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Not added</span>
                </div>
                <p className="text-sm text-muted-foreground">{result.reason}</p>
              </div>
            )}

            {result.decision === "revise" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Needs revision</span>
                </div>
                <p className="text-sm text-muted-foreground">{result.reason}</p>
                {result.recommendations.definitions.length > 0 && (
                  <div className="border border-rule p-3 space-y-2">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Suggested definitions
                    </p>
                    {result.recommendations.definitions.map((def, i) => (
                      <p key={i} className="text-sm text-ink">• {def}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleTryAnother}
              className="w-full h-10 px-4 border border-rule text-ink font-medium hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink"
            >
              Suggest another word
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
