-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create bundle_launches table
CREATE TABLE IF NOT EXISTS bundle_launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  
  -- Token configuration
  token_address TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_total_supply TEXT NOT NULL,
  
  -- Wallet configuration
  dev_wallet_address TEXT NOT NULL,
  funding_wallet_address TEXT NOT NULL,
  
  -- Bundle configuration
  bundle_wallet_count INTEGER NOT NULL,
  bundle_token_percent INTEGER NOT NULL,
  bundle_token_percent_per_wallet INTEGER NOT NULL,
  
  -- Liquidity configuration
  liquidity_eth_amount TEXT NOT NULL,
  liquidity_token_percent INTEGER NOT NULL,
  
  -- Execution configuration
  network TEXT NOT NULL,
  max_gas_price TEXT,
  max_priority_fee_per_gas TEXT,
  max_fee_per_gas TEXT,
  target_block INTEGER,
  bundle_timeout INTEGER,
  
  -- Status and tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending, executing, completed, failed, cancelled
  error_message TEXT,
  
  -- Execution results
  bundle_hash TEXT,
  transaction_hashes TEXT[],
  total_cost TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bundle_launches_short_id ON bundle_launches(short_id);
CREATE INDEX IF NOT EXISTS idx_bundle_launches_user_id ON bundle_launches(user_id);
CREATE INDEX IF NOT EXISTS idx_bundle_launches_token_address ON bundle_launches(token_address);
CREATE INDEX IF NOT EXISTS idx_bundle_launches_status ON bundle_launches(status);
CREATE INDEX IF NOT EXISTS idx_bundle_launches_created_at ON bundle_launches(created_at);

-- Trigger function to generate short_id
CREATE OR REPLACE FUNCTION generate_short_id_bundle_launches()
RETURNS TRIGGER AS $$
DECLARE
  key TEXT;
BEGIN
  LOOP
    key := encode(gen_random_bytes(6), 'base64');
    key := replace(key, '/', '_');
    key := replace(key, '+', '-');
    IF NOT EXISTS (SELECT 1 FROM bundle_launches WHERE short_id = key) THEN
      EXIT;
    END IF;
  END LOOP;
  NEW.short_id := key;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_short_id_bundle_launches
BEFORE INSERT ON bundle_launches
FOR EACH ROW
WHEN (NEW.short_id IS NULL)
EXECUTE FUNCTION generate_short_id_bundle_launches();

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bundle_launches_updated_at
BEFORE UPDATE ON bundle_launches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 