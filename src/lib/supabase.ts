import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdjuypoqiafqncwgmicf.supabase.co';
const supabasePublishableKey = 'sb_publishable_cJAhkB9oDjK-ecmrEshNvA_79F3_G55';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
