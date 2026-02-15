-- Add location field to posts table
-- Run this in Supabase SQL Editor

ALTER TABLE posts ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'negotiable';
