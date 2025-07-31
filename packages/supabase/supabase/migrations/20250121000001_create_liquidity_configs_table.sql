-- Create liquidity_configs table for liquidity pool creation settings
CREATE TABLE IF NOT EXISTS liquidity_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- Liquidity pool settings
  initial_liquidity_eth TEXT, -- ETH amount for initial liquidity
  liquidity_wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique names per user
  UNIQUE(user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_liquidity_configs_user_id ON liquidity_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_configs_wallet_id ON liquidity_configs(liquidity_wallet_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_configs_name ON liquidity_configs(name);

-- Enable Row Level Security
ALTER TABLE liquidity_configs ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on liquidity_configs" ON liquidity_configs
  FOR ALL USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_liquidity_configs_updated_at 
    BEFORE UPDATE ON liquidity_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 