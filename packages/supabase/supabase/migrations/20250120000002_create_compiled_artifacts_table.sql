-- Create compiled_artifacts table
CREATE TABLE IF NOT EXISTS compiled_artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES contract_instances(id) ON DELETE CASCADE,
  artifacts JSONB NOT NULL, -- The compiled artifacts (ABI, bytecode, deployedBytecode, etc.)
  compilation_time_ms INTEGER, -- How long compilation took
  compiler_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_compiled_artifacts_instance_id ON compiled_artifacts(instance_id);
CREATE INDEX IF NOT EXISTS idx_compiled_artifacts_created_at ON compiled_artifacts(created_at);

-- Enable Row Level Security
ALTER TABLE compiled_artifacts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now)
CREATE POLICY "Allow all operations on compiled_artifacts" ON compiled_artifacts
  FOR ALL USING (true); 