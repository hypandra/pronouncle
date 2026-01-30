"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "@/lib/auth-client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface PronouncleHeaderProps {
  showScore?: boolean
  score?: number
  delta?: number | null
}

export function PronouncleHeader({
  showScore = false,
  score,
  delta,
}: PronouncleHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()
  const redirectParam = encodeURIComponent(pathname || "/")
  const showDelta =
    showScore && typeof score === "number" && typeof delta === "number"
  const userLabel = session?.user?.name || "Account"

  return (
    <>
      <header className="mb-6 lg:mb-3">
        <div className="border-b border-rule pb-4">
          {/* Always visible: Title + pronunciation */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-ink">
              Pronouncle
            </h1>
            <span className="text-muted-foreground italic text-sm">verb</span>
            <span className="text-muted-foreground text-sm">|</span>
            <span className="text-muted-foreground text-sm font-mono tracking-wide">
              \ prə-ˈnaʊn-səl \
            </span>
            <button
              onClick={() => setDialogOpen(true)}
              className="text-accent-red hover:underline text-sm cursor-pointer transition-colors"
            >
              [Pruh-NOUN-sul]
            </button>
          </div>

          {/* Score (left) + Navigation (right) */}
          <div className="flex items-center gap-3 mt-2">
            {showDelta && (
              <div className="text-lg md:text-xl font-semibold text-ink">
                Score{" "}
                <span>
                  {score}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({delta >= 0 ? "+" : ""}
                    {delta})
                  </span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Link
                href="/words"
                className={`text-sm transition-colors ${pathname === "/words" || pathname?.startsWith("/words/") ? "text-ink font-medium underline" : "text-muted-foreground hover:text-ink"}`}
              >
                Words
              </Link>
              <Link
                href="/history"
                className={`text-sm transition-colors ${pathname === "/history" ? "text-ink font-medium underline" : "text-muted-foreground hover:text-ink"}`}
              >
                History
              </Link>
              <Link
                href="/progress"
                className={`text-sm transition-colors ${pathname === "/progress" ? "text-ink font-medium underline" : "text-muted-foreground hover:text-ink"}`}
              >
                Progress
              </Link>
              {session?.user && (
                <Link
                  href="/settings"
                  className={`text-sm transition-colors ${pathname === "/settings" ? "text-ink font-medium underline" : "text-muted-foreground hover:text-ink"}`}
                >
                  Settings
                </Link>
              )}
            </div>
            <div className="ml-auto flex items-center gap-3">
              {session?.user ? (
                <span className="text-sm text-muted-foreground">{userLabel}</span>
              ) : (
                <Link
                  href="/demo"
                  className="text-sm text-muted-foreground hover:text-ink transition-colors"
                >
                  Demo
                </Link>
              )}
              {session?.user ? (
                <button
                  onClick={() => signOut()}
                  className="text-sm text-muted-foreground hover:text-ink transition-colors"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href={`/signin?redirect=${redirectParam}`}
                  className="text-sm text-muted-foreground hover:text-ink transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>

          {/* Collapsible: Definition + Example */}
        </div>
      </header>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-ink">
              How to say "Pronouncle"
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-4 text-left">
                <div className="space-y-2">
                  <p className="font-mono text-ink font-semibold">prə (Pruh)</p>
                  <p className="text-muted-foreground">
                    This is a quick, unstressed sound. Think of the "Pro" in <em>Provide</em> or <em>Protect</em> (not the "Pro" in "Pro-athlete").
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-ink font-semibold">ˈnaʊn (NOUN)</p>
                  <p className="text-muted-foreground">
                    This is the stressed syllable. It sounds exactly like the English word <em>Noun</em> (rhymes with "down" or "clown").
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-ink font-semibold">səl (sul)</p>
                  <p className="text-muted-foreground">
                    This uses a "Soft C" sound. It rhymes with the end of <em>pencil</em>, <em>fossil</em>, or <em>counsel</em>.
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
