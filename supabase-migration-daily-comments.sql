-- Migration: Add daily_comments to brainstorm_solutions
-- Run this in your Supabase SQL Editor to fix the issue where comments added in the Brainstorming Solutions table are not saved.

ALTER TABLE public.brainstorm_solutions 
ADD COLUMN IF NOT EXISTS daily_comments JSONB DEFAULT '[]'::jsonb;
