import Link from "next/link"
import { PronouncleHeader } from "@/components/pronouncle-header"

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <PronouncleHeader />

        <div className="border border-rule bg-card p-6 mt-6 space-y-4">
          <h2 className="text-2xl font-display font-semibold text-ink">
            Word not found
          </h2>
          <p className="text-sm text-muted-foreground">
            That word isn’t in the current list. Try another word or head back to the list.
          </p>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-ink transition-colors"
          >
            Back to words
          </Link>
        </div>
      </div>
    </div>
  )
}
