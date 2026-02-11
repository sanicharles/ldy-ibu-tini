
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Note: Menggunakan placeholder. Untuk produksi, variabel ini harus diisi di environment.
const SUPABASE_URL = (window as any).env?.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = (window as any).env?.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
