-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create launch_configs table
CREATE TABLE IF NOT EXISTS launch_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  bundle_wallet_count INTEGER NOT NULL,
  eth_per_wallet TEXT NOT NULL,
  liquidity_eth_amount TEXT NOT NULL,
  liquidity_token_percent INTEGER NOT NULL,
  bundle_token_percent INTEGER NOT NULL, -- total % of token supply to bundle
  bundle_token_percent_per_wallet INTEGER NOT NULL, -- % per wallet
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_launch_configs_user_id ON launch_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_launch_configs_name ON launch_configs(name); 