const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing Supabase env vars. SUPABASE_URL present:',
    Boolean(process.env.SUPABASE_URL),
    'SUPABASE_SERVICE_ROLE_KEY present:',
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

// We use the service role key on the backend only, never exposed to the client.
// This lets the backend perform trusted operations (e.g. verifying a user's
// JWT, writing snapshots on their behalf) while RLS policies in Supabase
// still protect direct client access.
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

module.exports = { supabase };
