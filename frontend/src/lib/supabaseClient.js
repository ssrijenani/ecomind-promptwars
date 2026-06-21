import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in development rather than silently producing confusing
  // auth errors later if env vars are missing.
  console.error(
    'Missing Supabase env vars. Did you create frontend/.env from .env.example?'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
