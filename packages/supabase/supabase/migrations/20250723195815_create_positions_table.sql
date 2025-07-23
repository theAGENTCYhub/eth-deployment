-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  average_cost_basis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_positions_short_id ON positions(short_id);
CREATE INDEX IF NOT EXISTS idx_positions_wallet_address ON positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_positions_token_address ON positions(token_address);

-- Trigger function to generate short_id
CREATE OR REPLACE FUNCTION generate_short_id_positions()
RETURNS TRIGGER AS $$
DECLARE
  key TEXT;
BEGIN
  LOOP
    key := encode(gen_random_bytes(6), 'base64');
    key := replace(key, '/', '_');
    key := replace(key, '+', '-');
    IF NOT EXISTS (SELECT 1 FROM positions WHERE short_id = key) THEN
      EXIT;
    END IF;
  END LOOP;
  NEW.short_id := key;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_short_id_positions
BEFORE INSERT ON positions
FOR EACH ROW
WHEN (NEW.short_id IS NULL)
EXECUTE FUNCTION generate_short_id_positions();
