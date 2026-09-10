'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    const payload = {
      path: window.location.pathname,
      queryString: window.location.search,
      referrer: document.referrer || '',
    };

    fetch('/api/404-log', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, []);

  return (
    <main className="static-page">
      <span className="article-kicker">404</span>
      <h1>Page not found</h1>
      <p className="standfirst">The page you requested could not be found. The link may be old or the address may have changed.</p>
      <p><Link href="/">Return to Webfit News</Link></p>
    </main>
  );
}
