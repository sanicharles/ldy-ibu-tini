
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

/**
 * Supabase configuration.
 * Configured with provided Laundry Ibu Tini project credentials.
 */
const SUPABASE_URL = process.env.SUPABASE_URL || (window as any).env?.SUPABASE_URL || 'https://ucwypsrtmfkxgeutodkp.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || (window as any).env?.SUPABASE_ANON_KEY || 'sb_publishable_Ya4y19ek7sLb3OXXVTV8TA_zdJI4B52';

// Create a singleton client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'laundry-ibu-tini' },
  },
});

// Helper to check if configuration is valid and not using placeholders
export const isSupabaseConfigured = () => {
  const isUrlValid = SUPABASE_URL && !SUPABASE_URL.includes('your-project') && SUPABASE_URL.startsWith('https://');
  const isKeyValid = SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('your-anon-key');
  return !!(isUrlValid && isKeyValid);
};

export const getSupabaseConfig = () => ({
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY
});
