-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE,
  wallet_address TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  transaction_hash TEXT,
  block_number BIGINT,
  gas_used TEXT,
  gas_price TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_short_id ON transactions(short_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_address ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Trigger function to generate short_id
CREATE OR REPLACE FUNCTION generate_short_id_transactions()
RETURNS TRIGGER AS $$
DECLARE
  key TEXT;
BEGIN
  LOOP
    key := encode(gen_random_bytes(6), 'base64');
    key := replace(key, '/', '_');
    key := replace(key, '+', '-');
    IF NOT EXISTS (SELECT 1 FROM transactions WHERE short_id = key) THEN
      EXIT;
    END IF;
  END LOOP;
  NEW.short_id := key;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_short_id_transactions
BEFORE INSERT ON transactions
FOR EACH ROW
WHEN (NEW.short_id IS NULL OR NEW.short_id = '')
EXECUTE FUNCTION generate_short_id_transactions();
