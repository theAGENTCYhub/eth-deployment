-- Create contract_instances table
CREATE TABLE IF NOT EXISTS contract_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Telegram user ID
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL, -- Store all parameter values as key-value pairs
  source_code TEXT NOT NULL, -- The final source code after parameter injection
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'compiling', 'compiled', 'error'
  compilation_error TEXT,
  deployed_with_wallet_id UUID REFERENCES wallets(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique names per user
  UNIQUE(user_id, name)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_contract_instances_template_id ON contract_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_contract_instances_user_id ON contract_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_instances_status ON contract_instances(status);
CREATE INDEX IF NOT EXISTS idx_contract_instances_created_at ON contract_instances(created_at);

-- Enable Row Level Security
ALTER TABLE contract_instances ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now)
CREATE POLICY "Allow all operations on contract_instances" ON contract_instances
  FOR ALL USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_contract_instances_updated_at 
    BEFORE UPDATE ON contract_instances 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 