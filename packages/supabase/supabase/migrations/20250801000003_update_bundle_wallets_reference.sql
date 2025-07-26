-- Update bundle_wallets table to reference bundle_launches and add index field
ALTER TABLE bundle_wallets 
DROP CONSTRAINT IF EXISTS bundle_wallets_launch_id_fkey;

ALTER TABLE bundle_wallets 
ADD COLUMN IF NOT EXISTS wallet_index INTEGER;

-- Add foreign key constraint to bundle_launches
ALTER TABLE bundle_wallets 
ADD CONSTRAINT bundle_wallets_launch_id_fkey 
FOREIGN KEY (launch_id) REFERENCES bundle_launches(id) ON DELETE CASCADE;

-- Create index on wallet_index
CREATE INDEX IF NOT EXISTS idx_bundle_wallets_wallet_index ON bundle_wallets(wallet_index); 