import { createClient } from '@supabase/supabase-js';
import { config } from './config/env';
import { Database } from './types/database.types';

// Create Supabase client with generated types
export const supabase = createClient<Database>(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY
);

// Service role client for admin operations
export const supabaseAdmin = createClient<Database>(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY
);

// Re-export types
export type { Database } from './types/database.types'; 