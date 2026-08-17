import { createBrowserClient } from '@supabase/ssr';
import { getPublicEnv } from './env';

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getPublicEnv();
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
