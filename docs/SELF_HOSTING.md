# Self-Hosting Pronouncle

This guide covers deploying Pronouncle on your own infrastructure.

## Prerequisites

- [Bun](https://bun.sh) or Node.js 18+
- [Supabase](https://supabase.com) account
- [OpenAI](https://platform.openai.com) API key
- Optional: [BunnyCDN](https://bunny.net) account for cached TTS audio

## Quick Start

```bash
# Clone the repository
# (replace with your fork or the upstream URL)

git clone <repo-url>
cd pronouncle

# Install dependencies
bun install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
bun dev
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `DATABASE_URL` | Supabase Postgres connection string (pooler recommended) |
| `BETTER_AUTH_SECRET` | Random secret for BetterAuth session encryption |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Public base URL for auth client (e.g., `https://pronouncle.example.com`) |
| `OPENAI_API_KEY` | OpenAI API key (Whisper + TTS) |
| `OPENAI_TTS_MODEL` | Optional override for TTS model |
| `OPENAI_JUDGE_MODEL` | Optional override for suggestion evaluation model |
| `ALLOW_DEBUG_WORD_SUGGESTIONS` | `true` to enable debug suggestions route |
| `BUNNY_STORAGE_ZONE` | Bunny Storage Zone name |
| `BUNNY_STORAGE_API_KEY` | Bunny Storage API key |
| `NEXT_PUBLIC_BUNNY_CDN_URL` | Bunny CDN base URL (e.g., `https://your-zone.b-cdn.net`) |

## Supabase Setup

### 1. Create a Project

1. Create a new Supabase project.
2. Wait for the database to provision.

### 2. Get Connection Details

From the Supabase dashboard:

1. Go to **Settings > Database**.
2. Copy the **Connection string** (use the pooler connection string if available).
3. Replace `[YOUR-PASSWORD]` with your database password.

### 3. SSL Certificate (Required)

Pronouncle connects with SSL using the Supabase CA certificate.

1. Download the Supabase CA certificate from your project settings.
2. Save it as `prod-ca-2021.crt` in the project root.

### 4. Run Migrations

Apply the migration from `supabase/migrations/`:

```bash
# Via Supabase CLI
supabase db push

# Or copy the SQL from supabase/migrations/20260101000000_pronouncle_initial_schema.sql
# and run it in the Supabase SQL editor
```

The initial schema creates:
- `pronouncle.*` auth tables (users, sessions, accounts, verifications)
- `user_elo`, `word_elo`, `attempt_history` (Elo system)
- `ipa_pronunciations` (IPA data)
- `word_catalog`, `word_suggestions` (community words)

### 5. Load IPA Pronunciations

After running migrations, load the IPA seed data:

```bash
bun tsx scripts/load-ipa-to-supabase.ts
```

This uploads `data/ipa-data.json` into the `ipa_pronunciations` table.

## BetterAuth Setup

BetterAuth stores users and sessions in Postgres using the `pronouncle` schema. The migration should create:

- `pronouncle.users`
- `pronouncle.accounts`
- `pronouncle.sessions`
- `pronouncle.verifications`

Set a strong `BETTER_AUTH_SECRET` (e.g., `openssl rand -base64 32`).

## OpenAI Setup

- Create an API key at OpenAI.
- Set `OPENAI_API_KEY` in `.env.local`.
- Optional: set `OPENAI_TTS_MODEL` and `OPENAI_JUDGE_MODEL` to override defaults.

## BunnyCDN Setup (Optional)

Pronouncle can cache TTS audio in BunnyCDN to reduce repeat generation.

1. Create a **Storage Zone** in Bunny.
2. Create a **Pull Zone** with the Storage Zone as origin.
3. Add credentials to `.env.local`:

```env
BUNNY_STORAGE_ZONE=your-zone
BUNNY_STORAGE_API_KEY=your-api-key
NEXT_PUBLIC_BUNNY_CDN_URL=https://your-zone.b-cdn.net
```

## Deployment Options

### Vercel

1. Push your repo to GitHub.
2. Import the project in Vercel.
3. Add the environment variables from `.env.local`.
4. Ensure `prod-ca-2021.crt` is included in the deployment.

### Docker

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/prod-ca-2021.crt ./

EXPOSE 3000
CMD ["bun", "server.js"]
```

### VPS

```bash
bun run build
bun start
```

Use a process manager (systemd, pm2) for production.

## Troubleshooting

### Database connection errors

- Confirm `DATABASE_URL` uses the pooler connection string.
- Ensure `prod-ca-2021.crt` exists and is readable.
- Check Supabase connection limits.

### Auth issues

- Confirm `NEXT_PUBLIC_BETTER_AUTH_URL` matches your deployed URL.
- Ensure BetterAuth tables exist in the `pronouncle` schema.

### TTS cache errors

- Verify Bunny credentials and `NEXT_PUBLIC_BUNNY_CDN_URL`.
- Try disabling Bunny by removing those env vars.

## Security Notes

- Never commit `.env.local` or secrets.
- Rotate API keys if exposed.
- Use a strong `BETTER_AUTH_SECRET`.

## Support

Open an issue with logs and steps to reproduce.
