# Pronouncle

Pronouncle is a pronunciation practice app with a dictionary-style interface. Hear a word, speak it back, and get instant feedback powered by speech-to-text.

## Features

- **Text-to-speech (TTS)** to model pronunciations
- **Speech-to-text** checking for spoken attempts
- **Word suggestions** with automated review
- **Pronunciation practice** with example sentences and IPA guidance

## Tech Stack

- **Next.js (App Router)**
- **BetterAuth**
- **Supabase (PostgreSQL)**
- **OpenAI** (Whisper + TTS)
- **BunnyCDN** (audio storage + CDN)

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local` (see `.env.example` for descriptions).

### 3. Set up Supabase

1. Create a Supabase project.
2. Run the database migration from `supabase/migrations/001_initial_schema.sql` (if your checkout includes it).
3. Load IPA pronunciations into Supabase:
   ```bash
   bun tsx scripts/load-ipa-to-supabase.ts
   ```

### 4. Run the app

```bash
bun dev
```

Open http://localhost:3000.

## Architecture Notes

See `CLAUDE.md` for component and data flow details.

## Contributing

See `CONTRIBUTING.md`.

## Self-Hosting

See `docs/SELF_HOSTING.md`.

## License

MIT - see `LICENSE`.
