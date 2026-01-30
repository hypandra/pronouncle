import { Suspense } from "react"
import { PronouncleHeader } from "@/components/pronouncle-header"
import { SignInForm } from "@/components/signin-form"

export const dynamic = "force-dynamic"

export default function SignInPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <PronouncleHeader />

        <Suspense
          fallback={<p className="text-sm text-muted-foreground mt-6">Loading sign in...</p>}
        >
          <SignInForm />
        </Suspense>
      </div>
    </div>
  )
}
