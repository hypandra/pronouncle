-- Pronouncle Initial Schema
-- Creates all tables needed for the pronunciation practice app

-- ============================================================================
-- SCHEMA
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS pronouncle;

-- ============================================================================
-- BETTER AUTH TABLES (pronouncle schema)
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS pronouncle.users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  image TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS pronouncle.sessions (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES pronouncle.users(id) ON DELETE CASCADE
);

-- Accounts table
CREATE TABLE IF NOT EXISTS pronouncle.accounts (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES pronouncle.users(id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("providerId", "accountId")
);

-- Verification tokens table
CREATE TABLE IF NOT EXISTS pronouncle.verifications (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS pronouncle_sessions_user_id_idx ON pronouncle.sessions("userId");
CREATE INDEX IF NOT EXISTS pronouncle_sessions_token_idx ON pronouncle.sessions(token);
CREATE INDEX IF NOT EXISTS pronouncle_accounts_user_id_idx ON pronouncle.accounts("userId");
CREATE INDEX IF NOT EXISTS pronouncle_verifications_identifier_idx ON pronouncle.verifications(identifier);

-- ============================================================================
-- ELO SYSTEM TABLES (public schema)
-- ============================================================================

-- User Elo (one row per user)
CREATE TABLE IF NOT EXISTS user_elo (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE,
  elo_rating INTEGER NOT NULL DEFAULT 1500,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  successful_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Word Elo (one row per word)
CREATE TABLE IF NOT EXISTS word_elo (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  word TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  base_elo INTEGER NOT NULL,
  current_elo INTEGER NOT NULL,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  successful_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Attempt history
CREATE TABLE IF NOT EXISTS attempt_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  user_elo_before INTEGER NOT NULL,
  user_elo_after INTEGER NOT NULL,
  word_elo_before INTEGER NOT NULL,
  word_elo_after INTEGER NOT NULL,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for Elo system
CREATE INDEX IF NOT EXISTS idx_word_elo_word ON word_elo(word);
CREATE INDEX IF NOT EXISTS idx_word_elo_current ON word_elo(current_elo);
CREATE INDEX IF NOT EXISTS idx_attempt_user ON attempt_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempt_word ON attempt_history(word);

-- ============================================================================
-- IPA PRONUNCIATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ipa_pronunciations (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  lang TEXT NOT NULL DEFAULT 'en',
  ipa TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ipa_word ON ipa_pronunciations(word);

-- ============================================================================
-- WORD CATALOG & SUGGESTIONS (community words)
-- ============================================================================

-- Word catalog for core + community words
CREATE TABLE IF NOT EXISTS word_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  word_lower TEXT GENERATED ALWAYS AS (lower(word)) STORED,
  definition TEXT NOT NULL,
  sentence TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('core', 'community')),
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'pending')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS word_catalog_word_lower_key ON word_catalog (word_lower);

-- Suggestions with LLM verdicts and recommendations
CREATE TABLE IF NOT EXISTS word_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  user_definition TEXT,
  user_sentence TEXT,
  llm_decision TEXT NOT NULL CHECK (llm_decision IN ('approved', 'rejected', 'revise')),
  llm_feedback TEXT,
  llm_recommendations JSONB,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS word_suggestions_created_by_idx ON word_suggestions (created_by, created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate user Elo percentile
CREATE OR REPLACE FUNCTION pronouncle_user_elo_percentile(p_user_id TEXT)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  WITH target AS (
    SELECT elo_rating
    FROM user_elo
    WHERE user_id = p_user_id
  ),
  stats AS (
    SELECT count(*)::numeric AS total
    FROM user_elo
  ),
  rank AS (
    SELECT count(*)::numeric AS below
    FROM user_elo, target
    WHERE user_elo.elo_rating <= target.elo_rating
  )
  SELECT CASE
    WHEN stats.total = 0 OR target.elo_rating IS NULL THEN 0
    ELSE rank.below / stats.total
  END
  FROM stats, rank, target;
$$;

-- Get Elo percentile cutoffs
CREATE OR REPLACE FUNCTION pronouncle_elo_percentile_cutoffs()
RETURNS TABLE(
  p10 INTEGER,
  p25 INTEGER,
  p45 INTEGER,
  p65 INTEGER,
  p80 INTEGER,
  p93 INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    percentile_cont(0.10) WITHIN GROUP (ORDER BY elo_rating)::integer AS p10,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY elo_rating)::integer AS p25,
    percentile_cont(0.45) WITHIN GROUP (ORDER BY elo_rating)::integer AS p45,
    percentile_cont(0.65) WITHIN GROUP (ORDER BY elo_rating)::integer AS p65,
    percentile_cont(0.80) WITHIN GROUP (ORDER BY elo_rating)::integer AS p80,
    percentile_cont(0.93) WITHIN GROUP (ORDER BY elo_rating)::integer AS p93
  FROM user_elo;
$$;
