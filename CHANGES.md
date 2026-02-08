# CHANGES — iOS Safari Audio Fix (DEV-1547)

## Problem

Audio playback failed silently on iOS Safari. The root cause: iOS requires `audio.play()` to be called within the synchronous call stack of a user gesture (tap/click). In the existing code, `play()` was called after an async `fetch()` to the TTS API — by that point the user gesture budget had expired and iOS blocked playback.

Affected paths:
- `lib/audio.ts` `speak()` → fetches TTS audio, then plays (too late for iOS)
- `components/pronouncle-pronunciation-card.tsx` → creates `new Audio(cdnUrl)` on each tap

## Fix: Silent MP3 Unlock Pattern

**`lib/audio.ts`**
- Added a base64-encoded silent MP3 data URL constant (`SILENT_MP3`)
- Added a singleton `unlockedAudio` element and exported `unlockAudio()` function
- `unlockAudio()` creates (once) an `HTMLAudioElement`, plays the silent MP3 on it immediately within the user gesture, and returns the element
- Modified `playOpenTts()` to call `unlockAudio()` synchronously before the first `await`, then reuse the same element for the real TTS audio after the fetch completes
- iOS Safari recognizes the element as "user-activated" and permits subsequent `play()` calls on it

**`components/pronouncle-pronunciation-card.tsx`**
- Replaced per-tap `new Audio(url)` with `unlockAudio()` — reuses the singleton element
- Removed unused `useRef` import

## How It Works

1. User taps a play button
2. `unlockAudio()` runs synchronously — plays silent MP3 on the singleton element (iOS marks it as gesture-activated)
3. Async work happens (TTS fetch, CDN load)
4. Same element gets its `src` swapped to the real audio and `play()` succeeds because iOS still trusts it
