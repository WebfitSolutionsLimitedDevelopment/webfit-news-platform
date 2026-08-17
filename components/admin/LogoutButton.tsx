'use client';

import { createClient } from '../../lib/supabase-browser';

export function LogoutButton() {
  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  }

  return <button className="admin-logout" type="button" onClick={logout}>Sign out</button>;
}
