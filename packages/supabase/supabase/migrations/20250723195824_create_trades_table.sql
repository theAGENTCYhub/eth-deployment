-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE NOT NULL,
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  type TEXT NOT NULL,
  amount_token TEXT NOT NULL,
  amount_quote TEXT NOT NULL,
  price TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_short_id ON trades(short_id);
CREATE INDEX IF NOT EXISTS idx_trades_wallet_address ON trades(wallet_address);
CREATE INDEX IF NOT EXISTS idx_trades_token_address ON trades(token_address);
CREATE INDEX IF NOT EXISTS idx_trades_type ON trades(type);

-- Trigger function to generate short_id
CREATE OR REPLACE FUNCTION generate_short_id_trades()
RETURNS TRIGGER AS $$
DECLARE
  key TEXT;
BEGIN
  LOOP
    key := encode(gen_random_bytes(6), 'base64');
    key := replace(key, '/', '_');
    key := replace(key, '+', '-');
    IF NOT EXISTS (SELECT 1 FROM trades WHERE short_id = key) THEN
      EXIT;
    END IF;
  END LOOP;
  NEW.short_id := key;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_short_id_trades
BEFORE INSERT ON trades
FOR EACH ROW
WHEN (NEW.short_id IS NULL)
EXECUTE FUNCTION generate_short_id_trades();
