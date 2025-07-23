-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create token_launches table
CREATE TABLE IF NOT EXISTS token_launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  pair_address TEXT NOT NULL,
  amount_token TEXT NOT NULL,
  amount_eth TEXT NOT NULL,
  network TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_launches_short_id ON token_launches(short_id);
CREATE INDEX IF NOT EXISTS idx_token_launches_wallet_address ON token_launches(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_launches_token_address ON token_launches(token_address);
CREATE INDEX IF NOT EXISTS idx_token_launches_pair_address ON token_launches(pair_address);

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
WHEN (NEW.short_id IS NULL)
EXECUTE FUNCTION generate_short_id_token_launches();
