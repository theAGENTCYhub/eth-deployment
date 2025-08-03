-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create bundle_wallets table
CREATE TABLE IF NOT EXISTS bundle_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID REFERENCES token_launches(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  is_funded BOOLEAN DEFAULT false,
  wallet_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bundle_wallets_launch_id ON bundle_wallets(launch_id);
CREATE INDEX IF NOT EXISTS idx_bundle_wallets_wallet_address ON bundle_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_bundle_wallets_wallet_index ON bundle_wallets(wallet_index); 