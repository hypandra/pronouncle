# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server (port 3000)
bun build        # Production build
bun lint         # Run ESLint
```

## Architecture

Pronouncle is a pronunciation practice app built with Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase.

### Core Flow

1. **WordList** (`components/word-list.tsx`) - Displays words grouped by category (grade level, domain)
2. **SpeakingView** (`components/speaking-view.tsx`) - User records themselves saying a sentence containing the word
3. Speech-to-text via OpenAI Whisper API (`app/api/speech-to-text/route.ts`)
4. Transcript checked for word presence to determine success/failure

### Data

- **Word data**: Static list in `lib/word-data.ts` - includes word, definition, example sentence, category
- **IPA pronunciations**: Fetched from Supabase `ipa_pronunciations` table via `/api/ipa` route
- **Scripts**: `scripts/populate-ipa.ts` scrapes Wiktionary for IPA data

### Key Components

- `PronouncleHeader` - Dictionary-style header with collapsible definition, pronunciation guide dialog
- `lib/audio.ts` - Text-to-speech using Web Speech API with child-friendly voice selection

### Design System

Dictionary/editorial aesthetic using CSS variables in `globals.css`:
- `--ink` (dark text), `--cream` (background), `--rule` (borders)
- `--accent-red` (primary actions), `--success-green` (success states)
- Fonts: Playfair Display (display), Inter (body)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
OPENAI_TTS_MODEL=
DATABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BUNNY_STORAGE_ZONE=
BUNNY_STORAGE_API_KEY=
NEXT_PUBLIC_BUNNY_CDN_URL=
```

## Next.js 16 Params Pattern

Dynamic route params are Promises in Next.js 16 - you must await them before use:

```typescript
export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Now id is available
}
```
