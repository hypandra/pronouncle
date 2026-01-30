import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { ProgressProvider } from "@/contexts/progress-context"
import { PronouncleFooter } from "@/components/pronouncle-footer"

export const metadata: Metadata = {
  title: "Pronouncle",
  description: "Pronounce It",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-body">
        <ProgressProvider>
          {children}
          <PronouncleFooter />
        </ProgressProvider>
        {/* Curiosity Builds badge */}
        <Script
          src="https://hypandra.com/embed/curiosity-badge.js"
          strategy="lazyOnload"
          type="module"
        />
        {/* @ts-expect-error - Custom element from external script */}
        <curiosity-badge project="pronouncle" />
      </body>
    </html>
  )
}
