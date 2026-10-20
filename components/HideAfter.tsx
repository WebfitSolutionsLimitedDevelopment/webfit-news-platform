'use client';
import { useEffect, useState, type ReactNode } from 'react';

/**
 * Shows children until a deadline, then swaps to the fallback in the browser.
 * Covers pages served from cache after the deadline has passed.
 */
export function HideAfter({ until, fallback = null, children }: { until: number; fallback?: ReactNode; children: ReactNode }) {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const remaining = until - Date.now();
    if (remaining <= 0) { setExpired(true); return; }
    const timer = setTimeout(() => setExpired(true), Math.min(remaining, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [until]);
  return <>{expired ? fallback : children}</>;
}
