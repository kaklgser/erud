/*
  # JD-Based Resume Optimizer v2.0 - Tracking Tables

  ## Overview
  This migration adds comprehensive tracking for the upgraded JD-based resume optimizer
  with semantic validation, metric preservation, and project synthesis features.

  ## New Tables

  ### 1. rewrite_validations
  Tracks semantic validation results for bullet point rewrites
  - Stores semantic similarity scores
  - Identifies hallucinated terms
  - Tracks metric preservation
  - Records retry attempts

  ### 2. synthesized_projects
  Tracks AI-generated projects for skill gap filling
  - Stores project details and bullets
  - Records targeted skills and domain
  - Tracks user acceptance/editing
  - Maintains confidence scores

  ### 3. metric_tracking
  Monitors quantifiable metric preservation across optimization
  - Original vs preserved metrics
  - Preservation rate tracking
  - Auto-reinsertion logging

  ### 4. optimization_sessions
  Parent table linking all optimization artifacts
  - Session metadata and context
  - JD and resume references
  - Overall quality metrics

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - System can insert/update for authenticated users
*/

-- Create optimization sessions table
CREATE TABLE IF NOT EXISTS optimization_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_description TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  target_role TEXT,
  user_type TEXT CHECK (user_type IN ('student', 'fresher', 'experienced')),
  optimization_mode TEXT DEFAULT 'jd_based',
  overall_quality_score DECIMAL(5,2),
  semantic_avg_score DECIMAL(5,4),
  metric_preservation_rate DECIMAL(5,4),
  hallucination_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rewrite validations table
CREATE TABLE IF NOT EXISTS rewrite_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES optimization_sessions(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('experience', 'projects', 'summary', 'objective', 'additional')),
  section_index INTEGER,
  bullet_index INTEGER,
  original_text TEXT NOT NULL,
  rewritten_text TEXT NOT NULL,
  semantic_score DECIMAL(5,4) NOT NULL,
  has_hallucination BOOLEAN DEFAULT FALSE,
  hallucinated_terms TEXT[],
  metrics_preserved BOOLEAN DEFAULT TRUE,
  missing_metrics TEXT[],
  recommendation TEXT NOT NULL CHECK (recommendation IN ('accept', 'retry', 'reject')),
  retry_count INTEGER DEFAULT 0,
  validation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create synthesized projects table
CREATE TABLE IF NOT EXISTS synthesized_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES optimization_sessions(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  project_bullets TEXT[] NOT NULL,
  tech_stack TEXT[],
  domain TEXT,
  aligned_skills TEXT[],
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  template_used TEXT,
  realism_score INTEGER CHECK (realism_score >= 0 AND realism_score <= 100),
  accepted BOOLEAN DEFAULT FALSE,
  user_edited BOOLEAN DEFAULT FALSE,
  edited_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create metric tracking table
CREATE TABLE IF NOT EXISTS metric_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES optimization_sessions(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  section_index INTEGER,
  bullet_index INTEGER,
  original_metrics JSONB NOT NULL,
  preserved_metrics JSONB NOT NULL,
  lost_metrics JSONB,
  preservation_rate DECIMAL(5,4) NOT NULL,
  reinserted BOOLEAN DEFAULT FALSE,
  reinsertion_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_optimization_sessions_user_id ON optimization_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_optimization_sessions_created_at ON optimization_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewrite_validations_user_id ON rewrite_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_rewrite_validations_session_id ON rewrite_validations(session_id);
CREATE INDEX IF NOT EXISTS idx_synthesized_projects_user_id ON synthesized_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_synthesized_projects_session_id ON synthesized_projects(session_id);
CREATE INDEX IF NOT EXISTS idx_metric_tracking_session_id ON metric_tracking(session_id);

-- Enable Row Level Security
ALTER TABLE optimization_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewrite_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthesized_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for optimization_sessions
CREATE POLICY "Users can view own optimization sessions"
  ON optimization_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own optimization sessions"
  ON optimization_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own optimization sessions"
  ON optimization_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for rewrite_validations
CREATE POLICY "Users can view own rewrite validations"
  ON rewrite_validations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert rewrite validations"
  ON rewrite_validations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for synthesized_projects
CREATE POLICY "Users can view own synthesized projects"
  ON synthesized_projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create synthesized projects"
  ON synthesized_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own synthesized projects"
  ON synthesized_projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for metric_tracking
CREATE POLICY "Users can view own metric tracking"
  ON metric_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can track metrics"
  ON metric_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_optimization_sessions_updated_at
  BEFORE UPDATE ON optimization_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synthesized_projects_updated_at
  BEFORE UPDATE ON synthesized_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE optimization_sessions IS 'Tracks complete JD-based resume optimization sessions with quality metrics';
COMMENT ON TABLE rewrite_validations IS 'Validates bullet point rewrites for semantic drift and hallucinations';
COMMENT ON TABLE synthesized_projects IS 'Stores AI-generated projects to fill skill gaps from JD requirements';
COMMENT ON TABLE metric_tracking IS 'Monitors preservation of quantifiable metrics during optimization';

COMMENT ON COLUMN rewrite_validations.semantic_score IS 'Cosine similarity between original and rewritten (0-1), target >0.70';
COMMENT ON COLUMN synthesized_projects.confidence IS 'AI confidence in project relevance (0-1), generated based on skill match';
COMMENT ON COLUMN metric_tracking.preservation_rate IS 'Percentage of original metrics preserved (0-1)';