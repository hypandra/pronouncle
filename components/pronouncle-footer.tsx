"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "@/lib/auth-client"

export function PronouncleFooter() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isLandingPage = pathname === "/"
  const isSignedIn = !!session?.user

  return (
    <footer className="border-t border-rule bg-card">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm text-muted-foreground">
        <span className="font-display text-ink">Pronouncle</span>
        {isSignedIn && !isLandingPage && (
          <Link href="/" className="text-muted-foreground hover:text-ink transition-colors">
            View landing page
          </Link>
        )}
      </div>
    </footer>
  )
}
