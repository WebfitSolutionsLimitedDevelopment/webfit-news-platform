import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getPublicEnv } from './env';

export type PublicSiteSettings = {
  identity: { name?: string; domain?: string; tagline?: string };
  seo: { site_name?: string; default_locale?: string; default_title_suffix?: string };
  footer: { copyright_name?: string; media_council_member?: boolean };
  social: Record<string, string>;
};

export const getPublicSiteSettings = cache(async (): Promise<PublicSiteSettings> => {
  const {supabaseUrl,supabasePublishableKey}=getPublicEnv();
  const supabase=createClient(supabaseUrl,supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const { data, error } = await supabase
    .from('site_settings')
    .select('key,value')
    .in('key', ['site_identity','seo_defaults','footer','social_links']);

  if (error) {
    return {
      identity: { name: 'Webfit News', domain: 'webfitnews.co.nz', tagline: 'Independent New Zealand news and community reporting.' },
      seo: { site_name: 'Webfit News', default_locale: 'en_NZ', default_title_suffix: ' | Webfit News' },
      footer: { copyright_name: 'Webfit News', media_council_member: true },
      social: {},
    };
  }

  const map = Object.fromEntries((data ?? []).map((row:any) => [row.key, row.value ?? {}]));
  return {
    identity: map.site_identity ?? {},
    seo: map.seo_defaults ?? {},
    footer: map.footer ?? {},
    social: map.social_links ?? {},
  };
});
