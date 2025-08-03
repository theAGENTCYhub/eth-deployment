-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create token_launches table (unified launch table for both standalone and bundle launches)
CREATE TABLE IF NOT EXISTS token_launches (
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
  
  -- Launch type and configuration
  launch_type TEXT NOT NULL DEFAULT 'standalone', -- 'standalone' | 'bundle'
  
  -- Bundle configuration (for bundle launches)
  bundle_wallet_count INTEGER DEFAULT 0,
  bundle_token_percent INTEGER DEFAULT 0,
  bundle_token_percent_per_wallet INTEGER DEFAULT 0,
  
  -- Liquidity configuration
  liquidity_eth_amount TEXT DEFAULT '0',
  liquidity_token_percent INTEGER DEFAULT 0,
  
  -- Execution configuration
  network TEXT NOT NULL,
  max_gas_price TEXT,
  max_priority_fee_per_gas TEXT,
  max_fee_per_gas TEXT,
  target_block INTEGER,
  bundle_timeout INTEGER,
  
  -- Status and tracking
  status TEXT NOT NULL DEFAULT 'not_launched', -- 'not_launched', 'configuring', 'pending', 'executing', 'completed', 'failed', 'cancelled'
  error_message TEXT,
  
  -- Execution results
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  bundle_hash TEXT,
  transaction_hashes TEXT[],
  total_cost TEXT,
  
  -- Liquidity pool information (for completed launches)
  pair_address TEXT,
  amount_token TEXT,
  amount_eth TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_token_launches_short_id ON token_launches(short_id);
CREATE INDEX IF NOT EXISTS idx_token_launches_user_id ON token_launches(user_id);
CREATE INDEX IF NOT EXISTS idx_token_launches_token_address ON token_launches(token_address);
CREATE INDEX IF NOT EXISTS idx_token_launches_status ON token_launches(status);
CREATE INDEX IF NOT EXISTS idx_token_launches_launch_type ON token_launches(launch_type);
CREATE INDEX IF NOT EXISTS idx_token_launches_created_at ON token_launches(created_at);
CREATE INDEX IF NOT EXISTS idx_token_launches_user_status ON token_launches(user_id, status);

-- Trigger function to generate short_id
CREATE OR REPLACE FUNCTION generate_short_id_token_launches()
RETURNS TRIGGER AS $$
DECLARE
  key TEXT;
BEGIN
  LOOP
    key := encode(gen_random_bytes(6), 'base64');
    key := replace(key, '/', '_');
    key := replace(key, '+', '-');
    IF NOT EXISTS (SELECT 1 FROM token_launches WHERE short_id = key) THEN
      EXIT;
    END IF;
  END LOOP;
  NEW.short_id := key;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_short_id_token_launches
BEFORE INSERT ON token_launches
FOR EACH ROW
WHEN (NEW.short_id IS NULL OR NEW.short_id = '')
EXECUTE FUNCTION generate_short_id_token_launches();

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_token_launches_updated_at
BEFORE UPDATE ON token_launches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
