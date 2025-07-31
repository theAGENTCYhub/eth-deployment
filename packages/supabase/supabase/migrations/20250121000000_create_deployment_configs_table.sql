-- Create deployment_configs table for reusable contract parameter sets
CREATE TABLE IF NOT EXISTS deployment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  parameters JSONB, -- Contract parameters like token name, supply, tax settings, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique names per user
  UNIQUE(user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deployment_configs_user_id ON deployment_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_deployment_configs_name ON deployment_configs(name);

-- Enable Row Level Security
ALTER TABLE deployment_configs ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on deployment_configs" ON deployment_configs
  FOR ALL USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_deployment_configs_updated_at 
    BEFORE UPDATE ON deployment_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 