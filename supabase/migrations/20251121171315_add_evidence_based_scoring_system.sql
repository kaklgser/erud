/*
  # Evidence-Based JD Matching System - Phase 3

  1. New Tables
    - `evidence_locked_scores` - Store scoring results with evidence
    - `hybrid_match_results` - Store semantic+literal matching results
    - `keyword_context_validations` - Store keyword stuffing detection
    - `metric_reconciliation_logs` - Track metric preservation

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their data

  3. Indexes
    - Add indexes for user_id lookups
    - Add indexes for timestamp queries
*/

-- Evidence-Locked Scores Table
CREATE TABLE IF NOT EXISTS evidence_locked_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_text text NOT NULL,
  job_description text NOT NULL,
  overall_score integer NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  components jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  blocked_scores text[] DEFAULT ARRAY[]::text[],
  grade text NOT NULL CHECK (grade IN ('excellent', 'good', 'fair', 'poor')),
  role_classification jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hybrid Match Results Table
CREATE TABLE IF NOT EXISTS hybrid_match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_description text NOT NULL,
  resume_text text NOT NULL,
  matches jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_coverage decimal(5, 4) NOT NULL CHECK (overall_coverage >= 0 AND overall_coverage <= 1),
  unmatched_requirements jsonb DEFAULT '[]'::jsonb,
  matching_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Keyword Context Validations Table
CREATE TABLE IF NOT EXISTS keyword_context_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bullet_text text NOT NULL,
  jd_keywords text[] NOT NULL,
  is_stuffed boolean NOT NULL DEFAULT false,
  stuffing_score decimal(5, 4) NOT NULL CHECK (stuffing_score >= 0 AND stuffing_score <= 1),
  keywords_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations text[] DEFAULT ARRAY[]::text[],
  penalty_score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Metric Reconciliation Logs Table
CREATE TABLE IF NOT EXISTS metric_reconciliation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_bullets text[] NOT NULL,
  rewritten_bullets text[] NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_preservation_rate decimal(5, 4) NOT NULL CHECK (overall_preservation_rate >= 0 AND overall_preservation_rate <= 1),
  total_metrics_lost integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE evidence_locked_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_context_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_reconciliation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own evidence scores"
  ON evidence_locked_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evidence scores"
  ON evidence_locked_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own hybrid matches"
  ON hybrid_match_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hybrid matches"
  ON hybrid_match_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own keyword validations"
  ON keyword_context_validations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keyword validations"
  ON keyword_context_validations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own metric logs"
  ON metric_reconciliation_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metric logs"
  ON metric_reconciliation_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evidence_scores_user_created
  ON evidence_locked_scores(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hybrid_matches_user_created
  ON hybrid_match_results(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_keyword_validations_user_created
  ON keyword_context_validations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_metric_logs_user_created
  ON metric_reconciliation_logs(user_id, created_at DESC);
