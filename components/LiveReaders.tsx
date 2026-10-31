'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ArticleEnd.module.css';

/**
 * "3 people reading this story" pill. Uses Supabase Realtime presence (no database writes).
 * Shown only when 2 or more people are on the story: "1 reader" is just you, which says nothing.
 * Connects only after the reader starts scrolling, and disconnects while the tab is hidden.
 */
export function LiveReaders({ articleId }: { articleId: string }) {
  const [count, setCount] = useState(1);
  const [visible, setVisible] = useState(false);
  const lastShown = useRef(0);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let channel: any = null;
    let client: any = null;
    let stopped = false;
    const key = (() => { try { return crypto.randomUUID(); } catch { return `${Date.now()}${Math.random()}`; } })();

    const connect = async () => {
      if (channel || stopped || document.visibilityState !== 'visible') return;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anon) return;
      const { createClient } = await import('@supabase/supabase-js');
      if (stopped || channel) return;
      client = client || createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
      channel = client.channel(`readers:${articleId}`, { config: { presence: { key } } });
      channel
        .on('presence', { event: 'sync' }, () => setCount(Math.max(1, Object.keys(channel?.presenceState() || {}).length)))
        .subscribe((status: string) => { if (status === 'SUBSCRIBED') channel?.track({ at: Date.now() }); });
    };
    const disconnect = () => { if (channel && client) { client.removeChannel(channel); channel = null; } };

    const onScroll = () => { window.removeEventListener('scroll', onScroll); connect(); };
    const onVisibility = () => (document.visibilityState === 'visible' ? connect() : disconnect());
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      disconnect();
      window.clearTimeout(hideTimer.current);
    };
  }, [articleId]);

  // Show for 8 seconds whenever the number changes (and is 2+), not permanently.
  useEffect(() => {
    if (count < 2 || count === lastShown.current) { if (count < 2) setVisible(false); return; }
    lastShown.current = count;
    setVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisible(false), 8000);
  }, [count]);

  if (!visible) return null;
  return (
    <div className={styles.live} role="status">
      <span className={styles.liveDot} aria-hidden="true" />
      {count} people reading this story
    </div>
  );
}
