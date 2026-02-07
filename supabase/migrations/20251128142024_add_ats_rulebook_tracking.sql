/*
  # ATS Rulebook Compliance Tracking Schema

  1. New Tables
    - `ats_compliance_sessions`
      - Tracks full ATS compliance validation sessions
      - Stores 6-dimension scores and analysis results
      - Links to optimization sessions

    - `keyword_frequency_logs`
      - Tracks keyword frequency analysis per optimization
      - Monitors keyword optimization over time

    - `project_structure_validations`
      - Logs project structure compliance checks
      - Tracks Tech Used line presence and completeness

    - `certification_expansions`
      - Tracks certification name expansions
      - Logs before/after certification formats

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- ATS Compliance Sessions Table
CREATE TABLE IF NOT EXISTS ats_compliance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  optimization_session_id uuid,
  job_description_hash text NOT NULL,

  -- 6-Dimension Scores
  ats_formatting_score integer NOT NULL CHECK (ats_formatting_score >= 0 AND ats_formatting_score <= 100),
  technical_impact_score integer NOT NULL CHECK (technical_impact_score >= 0 AND technical_impact_score <= 100),
  keyword_optimization_score integer NOT NULL CHECK (keyword_optimization_score >= 0 AND keyword_optimization_score <= 100),
  jd_alignment_score integer NOT NULL CHECK (jd_alignment_score >= 0 AND jd_alignment_score <= 100),
  project_structuring_score integer NOT NULL CHECK (project_structuring_score >= 0 AND project_structuring_score <= 100),
  certifications_quality_score integer NOT NULL CHECK (certifications_quality_score >= 0 AND certifications_quality_score <= 100),
  overall_score integer NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Analysis Results
  section_order_valid boolean NOT NULL DEFAULT false,
  missing_sections jsonb DEFAULT '[]'::jsonb,
  summary_word_count integer DEFAULT 0,
  total_word_count integer DEFAULT 0,
  bullets_with_no_metrics integer DEFAULT 0,
  non_compliant_projects jsonb DEFAULT '[]'::jsonb,
  certifications_needing_fix jsonb DEFAULT '[]'::jsonb,

  -- Job Title Placement
  job_title_in_header boolean DEFAULT false,
  job_title_in_summary boolean DEFAULT false,
  job_title_in_experience boolean DEFAULT false,

  -- Recommendations
  recommendations jsonb DEFAULT '[]'::jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Keyword Frequency Logs Table
CREATE TABLE IF NOT EXISTS keyword_frequency_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ats_compliance_session_id uuid REFERENCES ats_compliance_sessions(id) ON DELETE CASCADE NOT NULL,

  keyword text NOT NULL,
  frequency integer NOT NULL DEFAULT 0,
  target_min integer NOT NULL DEFAULT 4,
  target_max integer NOT NULL DEFAULT 6,
  is_optimal boolean NOT NULL DEFAULT false,
  locations jsonb DEFAULT '[]'::jsonb,

  keyword_category text,
  importance_level text CHECK (importance_level IN ('critical', 'high', 'medium', 'low')),

  created_at timestamptz DEFAULT now()
);

-- Project Structure Validations Table
CREATE TABLE IF NOT EXISTS project_structure_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ats_compliance_session_id uuid REFERENCES ats_compliance_sessions(id) ON DELETE CASCADE NOT NULL,

  project_title text NOT NULL,
  is_compliant boolean NOT NULL DEFAULT false,
  has_problem_statement boolean NOT NULL DEFAULT false,
  has_impact_bullets boolean NOT NULL DEFAULT false,
  has_tech_used_line boolean NOT NULL DEFAULT false,

  impact_bullets_count integer DEFAULT 0,
  tech_stack_complete boolean NOT NULL DEFAULT false,

  missing_components jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  validation_score integer NOT NULL DEFAULT 0 CHECK (validation_score >= 0 AND validation_score <= 100),

  created_at timestamptz DEFAULT now()
);

-- Certification Expansions Table
CREATE TABLE IF NOT EXISTS certification_expansions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ats_compliance_session_id uuid REFERENCES ats_compliance_sessions(id) ON DELETE CASCADE NOT NULL,

  original_name text NOT NULL,
  expanded_name text NOT NULL,
  provider text NOT NULL,
  confidence_level text NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
  was_expanded boolean NOT NULL DEFAULT false,

  created_at timestamptz DEFAULT now()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ats_compliance_user_id ON ats_compliance_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ats_compliance_created_at ON ats_compliance_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ats_compliance_overall_score ON ats_compliance_sessions(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_frequency_session_id ON keyword_frequency_logs(ats_compliance_session_id);
CREATE INDEX IF NOT EXISTS idx_keyword_frequency_keyword ON keyword_frequency_logs(keyword);
CREATE INDEX IF NOT EXISTS idx_project_validation_session_id ON project_structure_validations(ats_compliance_session_id);
CREATE INDEX IF NOT EXISTS idx_certification_expansion_session_id ON certification_expansions(ats_compliance_session_id);

-- Enable Row Level Security
ALTER TABLE ats_compliance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_frequency_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_structure_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_expansions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ats_compliance_sessions
CREATE POLICY "Users can view own ATS compliance sessions"
  ON ats_compliance_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ATS compliance sessions"
  ON ats_compliance_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ATS compliance sessions"
  ON ats_compliance_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for keyword_frequency_logs
CREATE POLICY "Users can view own keyword logs"
  ON keyword_frequency_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ats_compliance_sessions
      WHERE ats_compliance_sessions.id = keyword_frequency_logs.ats_compliance_session_id
      AND ats_compliance_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own keyword logs"
  ON keyword_frequency_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ats_compliance_sessions
      WHERE ats_compliance_sessions.id = keyword_frequency_logs.ats_compliance_session_id
      AND ats_compliance_sessions.user_id = auth.uid()
    )
  );

-- RLS Policies for project_structure_validations
CREATE POLICY "Users can view own project validations"
  ON project_structure_validations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ats_compliance_sessions
      WHERE ats_compliance_sessions.id = project_structure_validations.ats_compliance_session_id
      AND ats_compliance_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project validations"
  ON project_structure_validations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ats_compliance_sessions
      WHERE ats_compliance_sessions.id = project_structure_validations.ats_compliance_session_id
      AND ats_compliance_sessions.user_id = auth.uid()
    )
  );

-- RLS Policies for certification_expansions
CREATE POLICY "Users can view own certification expansions"
  ON certification_expansions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ats_compliance_sessions
      WHERE ats_compliance_sessions.id = certification_expansions.ats_compliance_session_id
      AND ats_compliance_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own certification expansions"
  ON certification_expansions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ats_compliance_sessions
      WHERE ats_compliance_sessions.id = certification_expansions.ats_compliance_session_id
      AND ats_compliance_sessions.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ats_compliance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_ats_compliance_sessions_updated_at ON ats_compliance_sessions;
CREATE TRIGGER update_ats_compliance_sessions_updated_at
  BEFORE UPDATE ON ats_compliance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ats_compliance_updated_at();

-- Create view for ATS compliance analytics
CREATE OR REPLACE VIEW ats_compliance_analytics AS
SELECT
  user_id,
  COUNT(*) as total_sessions,
  AVG(overall_score) as avg_overall_score,
  AVG(ats_formatting_score) as avg_formatting_score,
  AVG(technical_impact_score) as avg_technical_score,
  AVG(keyword_optimization_score) as avg_keyword_score,
  AVG(jd_alignment_score) as avg_alignment_score,
  AVG(project_structuring_score) as avg_project_score,
  AVG(certifications_quality_score) as avg_certification_score,
  SUM(CASE WHEN overall_score >= 80 THEN 1 ELSE 0 END) as compliant_count,
  MAX(overall_score) as best_score,
  MIN(overall_score) as worst_score,
  MAX(created_at) as last_session_at
FROM ats_compliance_sessions
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON ats_compliance_analytics TO authenticated;
