-- Word catalog for core + community words
create table if not exists word_catalog (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  word_lower text generated always as (lower(word)) stored,
  definition text not null,
  sentence text not null,
  category text not null,
  source text not null check (source in ('core', 'community')),
  status text not null check (status in ('approved', 'rejected', 'pending')),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists word_catalog_word_lower_key
  on word_catalog (word_lower);

-- Suggestions with LLM verdicts and recommendations
create table if not exists word_suggestions (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  user_definition text,
  user_sentence text,
  llm_decision text not null check (llm_decision in ('approved', 'rejected', 'revise')),
  llm_feedback text,
  llm_recommendations jsonb,
  created_by text not null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists word_suggestions_created_by_idx
  on word_suggestions (created_by, created_at desc);
