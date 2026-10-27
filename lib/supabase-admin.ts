import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client: bypasses row security. Server code only, and
 * only after the caller has been checked as a Super Admin (user management)
 * or for system jobs such as notifications. Never expose it to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set on the server.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** A password people can read out or type: three words-ish chunks plus digits. */
export function generatePassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyz';
  const pick = (n: number) => Array.from(crypto.getRandomValues(new Uint32Array(n)), v => letters[v % letters.length]).join('');
  const digits = String(crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000);
  return `${pick(4)}-${pick(4)}-${pick(4)}-${digits}`;
}
