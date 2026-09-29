'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

/**
 * Sign-in / signed-in state, worked out in the browser from the stored
 * session. Doing this on the server called Supabase Auth on every page view
 * and stopped every public page from being cached.
 */
export function SupportBannerAccount() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    createClient().auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!alive || !user) return;
      setName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Reader');
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!name) return <Link className="support-signin" href="/login">Sign in</Link>;
  return <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>{name}</span>
    <form action="/auth/signout" method="post">
      <button className="support-signin" type="submit" style={{ border: 0, cursor: 'pointer', font: 'inherit' }}>Sign out</button>
    </form>
  </div>;
}
