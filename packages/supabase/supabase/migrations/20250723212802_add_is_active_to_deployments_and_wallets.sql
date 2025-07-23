-- Add is_active column for soft delete to deployments and wallets
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_deployments_is_active ON deployments(is_active);
CREATE INDEX IF NOT EXISTS idx_wallets_is_active ON wallets(is_active);
