-- Add is_deleted column to agents table
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;