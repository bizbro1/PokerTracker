import { createClient } from '@supabase/supabase-js';

// The publishable key is safe to expose in client code by design.
// Access control is enforced by Supabase row-level security.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://oudcxlaxzjksmnztqguw.supabase.co';
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_AYiTDbY0eAq-91t8RlryRw_aMjSAxrH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
