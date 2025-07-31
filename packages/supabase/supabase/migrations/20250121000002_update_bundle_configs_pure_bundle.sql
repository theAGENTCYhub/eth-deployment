-- Drop and recreate launch_configs as pure bundle configuration table
DROP TABLE IF EXISTS launch_configs CASCADE;

CREATE TABLE IF NOT EXISTS bundle_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- Bundle strategy settings
  bundle_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' | 'marketcap' (for future)
  
  -- Percentage-based bundle settings
  bundle_wallet_count INTEGER,
  total_supply_percentage INTEGER, -- % of total supply to buy across all wallets
  funding_wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  
  -- Future: Marketcap-based bundle settings (to be added later)
  target_marketcap_usd TEXT, -- For reverse marketcap bundles
  
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique names per user
  UNIQUE(user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bundle_configs_user_id ON bundle_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_bundle_configs_bundle_type ON bundle_configs(bundle_type);
CREATE INDEX IF NOT EXISTS idx_bundle_configs_funding_wallet_id ON bundle_configs(funding_wallet_id);
CREATE INDEX IF NOT EXISTS idx_bundle_configs_name ON bundle_configs(name);

-- Enable Row Level Security
ALTER TABLE bundle_configs ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on bundle_configs" ON bundle_configs
  FOR ALL USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_bundle_configs_updated_at 
    BEFORE UPDATE ON bundle_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 