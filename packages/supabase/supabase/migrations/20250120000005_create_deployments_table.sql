-- Drop old deployments table if it exists
DROP TABLE IF EXISTS deployments;

-- Create deployments table
CREATE TABLE deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_instance_id UUID NOT NULL REFERENCES contract_instances(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  transaction_hash TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for quick lookup
CREATE INDEX idx_deployments_contract_instance_id ON deployments(contract_instance_id);
CREATE INDEX idx_deployments_wallet_id ON deployments(wallet_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_deployed_at ON deployments(deployed_at);

-- Enable Row Level Security
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now)
CREATE POLICY "Allow all operations on deployments" ON deployments
  FOR ALL USING (true); 