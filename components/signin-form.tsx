"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, signUp, useSession } from "@/lib/auth-client"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"

  const safeRedirect = (target: string) => {
    if (!target.startsWith("/")) return "/"
    if (target.startsWith("//")) return "/"
    return target
  }

  const handleSuccessRedirect = () => {
    router.push(safeRedirect(redirectTo))
  }

  useEffect(() => {
    if (searchParams.get("redirect") === "/signin") {
      router.replace("/")
    }
  }, [searchParams, router])

  useEffect(() => {
    if (isPending) return
    if (session?.user) {
      router.replace(safeRedirect(redirectTo))
    }
  }, [isPending, session?.user, redirectTo, router])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      if (mode === "signin") {
        const result = await signIn.email({ email, password })
        if (result?.error) {
          setError(result.error.message || "Sign in failed.")
        } else {
          handleSuccessRedirect()
        }
      } else {
        const result = await signUp.email({
          email,
          name: name.trim() || "Pronouncle Learner",
          password,
        })
        if (result?.error) {
          setError(result.error.message || "Sign up failed.")
        } else {
          handleSuccessRedirect()
        }
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border border-rule bg-card p-6 mt-6">
      <h2 className="text-2xl font-display font-semibold text-ink">
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h2>
      <p className="text-sm text-muted-foreground mt-2">
        {mode === "signin"
          ? "Pick up where you left off across devices."
          : "Save your progress and history in the cloud."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full h-11 border border-rule bg-background px-3 text-ink focus:outline-none focus:ring-2 focus:ring-accent-red"
              placeholder="Display name"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full h-11 border border-rule bg-background px-3 text-ink focus:outline-none focus:ring-2 focus:ring-accent-red"
            placeholder="you@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full h-11 border border-rule bg-background px-3 text-ink focus:outline-none focus:ring-2 focus:ring-accent-red"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-accent-red border border-accent-red/30 bg-accent-red/5 p-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-success-green text-white font-semibold hover:bg-success-green/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="mt-4 text-sm text-muted-foreground">
        {mode === "signin" ? "Need an account?" : "Already have an account?"}{" "}
        <button
          className="text-ink hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </div>

      <div className="mt-6 text-xs text-muted-foreground">
        <Link href="/words" className="hover:text-ink transition-colors">
          Back to practice
        </Link>
      </div>
    </div>
  )
}
