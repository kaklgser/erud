/*
  # ATS Optimization Tracking System

  1. New Tables
    - `ats_optimization_logs` - Track bullet length fixes and methodology alignments

  2. Security
    - Enable RLS on table
    - Add policies for authenticated users

  3. Purpose
    - Track ATS optimization effectiveness
    - Store before/after metrics
    - Monitor feature flag usage
*/

CREATE TABLE IF NOT EXISTS ats_optimization_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bullet_fixes jsonb DEFAULT '[]'::jsonb,
  methodology_alignments jsonb DEFAULT '{}'::jsonb,
  length_violations_before integer NOT NULL DEFAULT 0,
  length_violations_after integer NOT NULL DEFAULT 0,
  methodology_coverage_before decimal(5, 4) DEFAULT 0,
  methodology_coverage_after decimal(5, 4) DEFAULT 0,
  feature_flags jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ats_optimization_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ATS logs"
  ON ats_optimization_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ATS logs"
  ON ats_optimization_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ats_logs_user_created
  ON ats_optimization_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ats_logs_violations
  ON ats_optimization_logs(length_violations_before, length_violations_after);
