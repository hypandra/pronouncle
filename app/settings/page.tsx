"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useSession, signOut } from "@/lib/auth-client"
import { PronouncleHeader } from "@/components/pronouncle-header"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export default function SettingsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [name, setName] = useState("")
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState("")

  const [isResettingHistory, setIsResettingHistory] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState("")

  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/signin?redirect=/settings")
    }
  }, [isPending, session?.user, router])

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
  }, [session?.user?.name])

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isSavingName) return

    setIsSavingName(true)
    setNameError("")
    setNameSuccess(false)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        setNameError(data.error || "Failed to update name")
        return
      }

      setNameSuccess(true)
      // Refresh the page to update session
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      setNameError("Network error. Please try again.")
    } finally {
      setIsSavingName(false)
    }
  }

  const handleResetHistory = async () => {
    setIsResettingHistory(true)
    setResetError("")

    try {
      const response = await fetch("/api/user/history", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        setResetError(data.error || "Failed to reset history")
        return
      }

      setResetSuccess(true)
      setResetConfirmOpen(false)
    } catch {
      setResetError("Network error. Please try again.")
    } finally {
      setIsResettingHistory(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    setDeleteError("")

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        setDeleteError(data.error || "Failed to delete account")
        return
      }

      // Sign out and redirect to landing
      await signOut()
      router.replace("/")
    } catch {
      setDeleteError("Network error. Please try again.")
    } finally {
      setIsDeletingAccount(false)
    }
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <PronouncleHeader />

        {/* Profile Section */}
        <section className="mb-8">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
            Profile
          </h3>
          <form onSubmit={handleSaveName} className="border border-rule bg-card p-4 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="displayName"
                className="text-xs uppercase tracking-widest text-muted-foreground"
              >
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 border border-rule bg-cream px-3 text-ink focus:outline-none focus:border-ink transition-colors"
                maxLength={100}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Email: {session.user.email}
            </div>

            {nameError && (
              <p className="text-sm text-accent-red">{nameError}</p>
            )}

            {nameSuccess && (
              <p className="text-sm text-success-green">Name updated successfully!</p>
            )}

            <button
              type="submit"
              disabled={isSavingName || !name.trim()}
              className="h-10 px-4 bg-ink text-cream font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
            >
              {isSavingName ? "Saving..." : "Save"}
            </button>
          </form>
        </section>

        {/* History Section */}
        <section className="mb-8">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
            History
          </h3>
          <div className="border border-rule bg-card p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Reset your pronunciation history and start fresh. Your score will be reset to the
              default rating (1500). This cannot be undone.
            </p>

            {resetError && (
              <p className="text-sm text-accent-red">{resetError}</p>
            )}

            {resetSuccess && (
              <p className="text-sm text-success-green">History reset successfully!</p>
            )}

            <button
              onClick={() => setResetConfirmOpen(true)}
              disabled={resetSuccess}
              className="h-10 px-4 border border-rule text-ink font-medium hover:bg-muted/30 transition-colors disabled:opacity-50"
            >
              Reset History
            </button>
          </div>
        </section>

        {/* Account Section */}
        <section>
          <h3 className="text-sm uppercase tracking-widest text-accent-red mb-4">
            Danger Zone
          </h3>
          <div className="border border-accent-red/30 bg-accent-red/5 p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be
              undone. Your history and progress will be removed.
            </p>

            {deleteError && (
              <p className="text-sm text-accent-red">{deleteError}</p>
            )}

            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="h-10 px-4 bg-accent-red text-white font-medium hover:bg-accent-red/90 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      {/* Reset History Confirmation Dialog */}
      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-ink">
              Reset History?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all your pronunciation attempts and reset your score
              to 1500. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setResetConfirmOpen(false)}
              className="flex-1 h-10 px-4 border border-rule text-ink font-medium hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResetHistory}
              disabled={isResettingHistory}
              className="flex-1 h-10 px-4 bg-accent-red text-white font-medium hover:bg-accent-red/90 transition-colors disabled:opacity-50"
            >
              {isResettingHistory ? "Resetting..." : "Reset History"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-ink">
              Delete Account?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all your data. You will not be able
              to recover your account or any of your history.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="flex-1 h-10 px-4 border border-rule text-ink font-medium hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="flex-1 h-10 px-4 bg-accent-red text-white font-medium hover:bg-accent-red/90 transition-colors disabled:opacity-50"
            >
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
