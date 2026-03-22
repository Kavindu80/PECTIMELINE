-- ============================================
-- MDS SE Timeline - Supabase Database Schema
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- Dashboard: https://app.supabase.com
-- Project: syivxbovdmleuxplvoqx

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  department TEXT,
  password_changed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  in_week INTEGER,
  style_in_date DATE,
  no TEXT,
  core TEXT,
  source TEXT,
  customer TEXT NOT NULL,
  style_no TEXT NOT NULL,
  product TEXT,
  component TEXT,
  chassis TEXT,
  solution TEXT,
  
  -- Personnel/Flags
  fi BOOLEAN DEFAULT FALSE,
  pp BOOLEAN DEFAULT FALSE,
  psd BOOLEAN DEFAULT FALSE,
  
  order_qty INTEGER,
  plant TEXT,
  platform_style TEXT,
  term TEXT,
  
  -- Cut Dates
  cut_requested_date DATE,
  cut_required_date DATE,
  commited_date DATE,
  cut_received_date DATE,
  cut_handover_date DATE,
  comment TEXT,
  
  -- Critical Path Dates
  cut_kit_checking DATE,
  working_week INTEGER,
  brainstorming_date DATE,
  machine_availability_date DATE,
  se_trial_date DATE,
  solution_completed_date DATE,
  mockup_date DATE,
  technical_validation_date DATE,
  video_date DATE,
  video_link TEXT,
  video_description TEXT,
  stw_date DATE,
  mds_date DATE,
  pd_date DATE,
  share_point_date DATE,
  
  -- Print Sheet Specific
  sample_date DATE,
  bom_date DATE,
  dxf_date DATE,
  cut_trims_date DATE,
  sewing_te TEXT,
  pattern_te TEXT,
  
  -- Actual Dates
  brainstorming_actual_date DATE,
  se_trial_actual_date DATE,
  solution_completed_actual_date DATE,
  mockup_actual_date DATE,
  technical_validation_actual_date DATE,
  video_actual_date DATE,
  stw_actual_date DATE,
  mds_actual_date DATE,
  pd_actual_date DATE,
  share_point_actual_date DATE,
  cut_kit_checking_actual_date DATE,
  ie_share_actual_date DATE,
  unlock_sdh_actual_date DATE,
  handover_ve_actual_date DATE,
  plant_handover_ve_actual_date DATE,
  ingenium_app_actual_date DATE,
  
  -- Handover & IE
  ie_share_date DATE,
  unlock_sdh_date DATE,
  smv_savings TEXT,
  handover_ve_date DATE,
  plant_handover_ve_date DATE,
  routed TEXT,
  ingenium_app_updating TEXT,
  
  -- Size Set
  size_set_completion_date DATE,
  size_set_ve_handover_date DATE,
  
  -- Planning
  fi_date DATE,
  pp_date DATE,
  psd_date DATE,
  planned_start_date DATE,
  actual_start_date DATE,
  comments_on_start_delay TEXT,
  planned_complete_date DATE,
  actual_complete_date DATE,
  comments_on_completion_delay TEXT,
  status TEXT DEFAULT 'Active',
  reason_for_drop TEXT,
  
  -- Computed/Legacy
  category TEXT CHECK (category IN ('Summary', 'MDS SE', 'Unichela Panadura VE', 'Casualine VE', 'Long Term')),
  deadline_status TEXT CHECK (deadline_status IN ('On Track', 'Approaching', 'Overdue', 'Extended')),
  engineer_name TEXT,
  mechanic TEXT,
  sewing TEXT,
  style_due_date DATE,
  extended_deadline DATE,
  
  -- VE Handover
  ve_handover TEXT,
  ve_handover_date DATE,
  handover_source TEXT,
  
  -- SE Signoff
  initial_smv TEXT,
  latest_smv TEXT,
  total_smv_saving TEXT,
  eph TEXT,
  operational_cost_savings TEXT,
  impact TEXT,
  se_signoff_date DATE,
  
  -- Stage Notes (JSONB for flexibility - legacy)
  stage_notes JSONB DEFAULT '{}'::jsonb,
  
  -- Daily Notes for all stages (JSONB array)
  daily_notes JSONB DEFAULT '[]'::jsonb,
  
  -- Stage Comments for all stages (JSONB array for longer form content)
  stage_comments JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brainstorm Solutions table
CREATE TABLE IF NOT EXISTS public.brainstorm_solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  entry_date DATE,
  machine_code TEXT,
  operation_smv TEXT, -- Costed SMV
  actual_smv TEXT,
  expected_smv TEXT,
  routed_smv TEXT,
  saving_smv TEXT, -- Auto-calculated: costed - routed
  operation TEXT,
  solution_text TEXT,
  comments TEXT,
  team TEXT,
  responsible TEXT,
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  actual_machine_date DATE,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Trial', 'Done', 'Drop')),
  
  -- Solution-wise links
  video_link TEXT,
  video_description TEXT,
  stw_link TEXT,
  mds_link TEXT,
  pd_link TEXT,
  video_date DATE,
  stw_date DATE,
  mds_date DATE,
  pd_date DATE,
  
  -- VE-specific fields (Unichela Panadura VE and Casualine VE only)
  yamazumi_chart_link TEXT,
  yamazumi_chart_date DATE,
  craftsmanship_level TEXT CHECK (craftsmanship_level IN ('Level 1', 'Level 2', 'Level 3', 'Level 4')),
  layout_link TEXT,
  layout_date DATE,
  
  -- Stage tracking (JSONB)
  stage_tracking JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solution Machines table
CREATE TABLE IF NOT EXISTS public.solution_machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solution_id UUID NOT NULL REFERENCES public.brainstorm_solutions(id) ON DELETE CASCADE,
  
  machine_type TEXT NOT NULL,
  attachments TEXT,
  count INTEGER DEFAULT 1,
  kit_status TEXT DEFAULT 'Pending' CHECK (kit_status IN ('Pending', 'Ready', 'Issue')),
  remarks TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cut Kit Items table
CREATE TABLE IF NOT EXISTS public.cut_kit_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  component TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  received_qty INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Complete', 'Missing')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cut Actuals table
CREATE TABLE IF NOT EXISTS public.cut_actuals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  requested DATE,
  required DATE,
  received DATE,
  handover DATE,
  responsible TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stage File Links table
CREATE TABLE IF NOT EXISTS public.stage_file_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES public.brainstorm_solutions(id) ON DELETE CASCADE,
  
  stage_id TEXT NOT NULL, -- 'mds', 'pd', 'stw', etc.
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'excel', 'image', 'other')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id),
  planned_date DATE,
  actual_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deadline History table
CREATE TABLE IF NOT EXISTS public.deadline_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('urgent', 'warning', 'info')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  owner TEXT,
  read BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON public.projects(customer);
CREATE INDEX IF NOT EXISTS idx_projects_style_no ON public.projects(style_no);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);

-- Solutions indexes
CREATE INDEX IF NOT EXISTS idx_solutions_project_id ON public.brainstorm_solutions(project_id);
CREATE INDEX IF NOT EXISTS idx_solutions_status ON public.brainstorm_solutions(status);

-- File links indexes
CREATE INDEX IF NOT EXISTS idx_file_links_project_id ON public.stage_file_links(project_id);
CREATE INDEX IF NOT EXISTS idx_file_links_solution_id ON public.stage_file_links(solution_id);
CREATE INDEX IF NOT EXISTS idx_file_links_stage_id ON public.stage_file_links(stage_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON public.notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ============================================
-- 4. CREATE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solutions_updated_at BEFORE UPDATE ON public.brainstorm_solutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON public.solution_machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cut_kit_items_updated_at BEFORE UPDATE ON public.cut_kit_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cut_actuals_updated_at BEFORE UPDATE ON public.cut_actuals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_links_updated_at BEFORE UPDATE ON public.stage_file_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brainstorm_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solution_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_file_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Projects policies (all authenticated users can read/write)
CREATE POLICY "Authenticated users can view projects"
  ON public.projects FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update projects"
  ON public.projects FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete projects"
  ON public.projects FOR DELETE
  USING (auth.role() = 'authenticated');

-- Brainstorm solutions policies
CREATE POLICY "Authenticated users can view solutions"
  ON public.brainstorm_solutions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert solutions"
  ON public.brainstorm_solutions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update solutions"
  ON public.brainstorm_solutions FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete solutions"
  ON public.brainstorm_solutions FOR DELETE
  USING (auth.role() = 'authenticated');

-- Solution machines policies
CREATE POLICY "Authenticated users can view machines"
  ON public.solution_machines FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage machines"
  ON public.solution_machines FOR ALL
  USING (auth.role() = 'authenticated');

-- Cut kit items policies
CREATE POLICY "Authenticated users can view cut kit items"
  ON public.cut_kit_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage cut kit items"
  ON public.cut_kit_items FOR ALL
  USING (auth.role() = 'authenticated');

-- Cut actuals policies
CREATE POLICY "Authenticated users can view cut actuals"
  ON public.cut_actuals FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage cut actuals"
  ON public.cut_actuals FOR ALL
  USING (auth.role() = 'authenticated');

-- Stage file links policies
CREATE POLICY "Authenticated users can view file links"
  ON public.stage_file_links FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage file links"
  ON public.stage_file_links FOR ALL
  USING (auth.role() = 'authenticated');

-- Deadline history policies
CREATE POLICY "Authenticated users can view deadline history"
  ON public.deadline_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert deadline history"
  ON public.deadline_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Notifications policies
CREATE POLICY "Authenticated users can view notifications"
  ON public.notifications FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage notifications"
  ON public.notifications FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- 7. STORAGE BUCKETS
-- ============================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('documents', 'documents', true),
  ('videos', 'videos', true),
  ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );

-- Storage policies for videos bucket
CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can update videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'videos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'videos' AND
    auth.role() = 'authenticated'
  );

-- Storage policies for images bucket
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can update images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- SCHEMA SETUP COMPLETE!
-- ============================================

-- Next steps:
-- 1. Create initial users in Supabase Dashboard → Authentication
-- 2. Use the credentials from supabase-initial-users.sql
-- 3. Test login with the application

SELECT 'Database schema created successfully!' AS status;
