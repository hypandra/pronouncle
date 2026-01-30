# Contributing to Pronouncle

Thanks for your interest in contributing! Pronouncle focuses on making pronunciation practice feel friendly, fast, and reliable.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `bun install`
4. Copy `.env.example` to `.env.local` and configure your environment
5. Run the development server: `bun dev`

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) (package manager/runtime)
- [Supabase](https://supabase.com) account (PostgreSQL)
- [OpenAI](https://platform.openai.com) API key (TTS + speech-to-text)
- Optional: [BunnyCDN](https://bunny.net) for audio caching

### Database

- Run the migration from `supabase/migrations/001_initial_schema.sql` (if present).
- Load IPA pronunciations with:
  ```bash
  bun tsx scripts/load-ipa-to-supabase.ts
  ```

See `docs/SELF_HOSTING.md` for more detailed setup instructions.

## Code Style

- **TypeScript** (strict)
- **2-space indentation**, double quotes, no semicolons
- Components: PascalCase filenames (`SpeakingView.tsx`)
- Routes: kebab-case directories (`app/speech-to-text-demo/`)
- Tailwind CSS for styling

Run `bun lint` before submitting.

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what changed and why
- Reference related issues if relevant
- Ensure `bun lint` and `bun build` pass
- Add screenshots for UI changes

## Reporting Issues

Please include:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots or console output if helpful

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
