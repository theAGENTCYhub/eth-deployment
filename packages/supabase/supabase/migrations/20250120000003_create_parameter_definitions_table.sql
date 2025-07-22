-- Create parameter_definitions table
CREATE TABLE IF NOT EXISTS parameter_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parameter_key TEXT NOT NULL UNIQUE, -- The key used in placeholders like {{TOKEN_NAME}}
  parameter_name TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL, -- 'string', 'number', 'boolean', 'address'
  default_value TEXT,
  validation_rules JSONB, -- Store validation rules like min/max values, patterns, etc.
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_parameter_definitions_key ON parameter_definitions(parameter_key);
CREATE INDEX IF NOT EXISTS idx_parameter_definitions_display_order ON parameter_definitions(display_order);

-- Enable Row Level Security
ALTER TABLE parameter_definitions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now)
CREATE POLICY "Allow all operations on parameter_definitions" ON parameter_definitions
  FOR ALL USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_parameter_definitions_updated_at 
    BEFORE UPDATE ON parameter_definitions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 
