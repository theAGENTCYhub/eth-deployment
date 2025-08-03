-- Add launch_id field to positions table for unified launch positions
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS launch_id UUID REFERENCES token_launches(id) ON DELETE CASCADE;

-- Add status field to positions table
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, completed, failed

-- Add eth_spent field to positions table for bundle launches
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS eth_spent TEXT;

-- Create index on launch_id
CREATE INDEX IF NOT EXISTS idx_positions_launch_id ON positions(launch_id);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status); 