-- ============================================
-- Migration: Add JSONB columns for sub-resource data
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- These columns store cutKitItems, cutActuals, stageFiles, and deadlineHistory
-- as JSONB directly on the projects table for reliable persistence.

-- Add JSONB columns to projects table
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS cut_kit_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cut_actuals JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS stage_files JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deadline_history JSONB DEFAULT '[]'::jsonb;

-- Add JSONB column to brainstorm_solutions for machine kits
ALTER TABLE public.brainstorm_solutions
  ADD COLUMN IF NOT EXISTS machines JSONB DEFAULT '[]'::jsonb;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('projects', 'brainstorm_solutions')
  AND column_name IN ('cut_kit_items', 'cut_actuals', 'stage_files', 'deadline_history', 'machines');
