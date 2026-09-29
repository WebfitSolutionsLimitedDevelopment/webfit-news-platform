import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv } from './env';

let client: SupabaseClient | null = null;

/**
 * Read-only client for public pages. It never touches cookies, so pages that
 * use it can be cached at the edge (the cookie-based server client forces
 * every page to render from scratch on every visit). Row-level security still
 * applies exactly as for a signed-out reader.
 */
export async function createPublicClient(): Promise<SupabaseClient> {
  if (!client) {
    const { supabaseUrl, supabasePublishableKey } = getPublicEnv();
    client = createSupabaseClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}
