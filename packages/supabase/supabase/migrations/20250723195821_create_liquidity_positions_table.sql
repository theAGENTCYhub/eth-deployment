-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create liquidity_positions table
CREATE TABLE IF NOT EXISTS liquidity_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  pair_address TEXT NOT NULL,
  amount_lp_tokens TEXT NOT NULL,
  amount_token TEXT NOT NULL,
  amount_eth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_liquidity_positions_short_id ON liquidity_positions(short_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_positions_wallet_address ON liquidity_positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_liquidity_positions_pair_address ON liquidity_positions(pair_address);

-- Trigger function to generate short_id
CREATE OR REPLACE FUNCTION generate_short_id_liquidity_positions()
RETURNS TRIGGER AS $$
DECLARE
  key TEXT;
BEGIN
  LOOP
    key := encode(gen_random_bytes(6), 'base64');
    key := replace(key, '/', '_');
    key := replace(key, '+', '-');
    IF NOT EXISTS (SELECT 1 FROM liquidity_positions WHERE short_id = key) THEN
      EXIT;
    END IF;
  END LOOP;
  NEW.short_id := key;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_short_id_liquidity_positions
BEFORE INSERT ON liquidity_positions
FOR EACH ROW
WHEN (NEW.short_id IS NULL)
EXECUTE FUNCTION generate_short_id_liquidity_positions();
