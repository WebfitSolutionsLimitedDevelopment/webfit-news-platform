const PROJECT_REF = 'akyavvskmlrjptyuxkmk';
const PRODUCTION_HOST = 'webfitnews.co.nz';

export function getPublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required.');
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required.');
  if (key === 'your_publishable_key_here') {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be configured.');
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must use HTTPS.');
  }

  if (process.env.NODE_ENV === 'production' && parsed.hostname !== `${PROJECT_REF}.supabase.co`) {
    throw new Error('Production Supabase URL does not match the dedicated Webfit News project.');
  }

  return { supabaseUrl: url, supabasePublishableKey: key } as const;
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || `https://${PRODUCTION_HOST}`;
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL must be a valid URL.');
  }

  if (process.env.NODE_ENV === 'production') {
    if (parsed.protocol !== 'https:') throw new Error('Production site URL must use HTTPS.');
    if (parsed.hostname !== PRODUCTION_HOST) {
      throw new Error(`Production site URL must use ${PRODUCTION_HOST}.`);
    }
  }

  return parsed.origin;
}

export function getDeploymentIdentity() {
  return {
    projectRef: PROJECT_REF,
    productionHost: PRODUCTION_HOST,
  } as const;
}
