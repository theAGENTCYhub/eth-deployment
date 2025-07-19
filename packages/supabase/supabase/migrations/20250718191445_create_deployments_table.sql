-- This is a dummy table for now.

-- Create deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now)
CREATE POLICY "Allow all operations on deployments" ON deployments
  FOR ALL USING (true);
