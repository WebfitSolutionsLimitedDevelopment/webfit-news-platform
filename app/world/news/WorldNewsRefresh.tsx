'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const REFRESH_SECONDS = 60;

export default function WorldNewsRefresh() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(REFRESH_SECONDS);
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    setRemaining(REFRESH_SECONDS);
    startTransition(() => router.refresh());
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          if (document.visibilityState === 'visible') {
            startTransition(() => router.refresh());
          }
          return REFRESH_SECONDS;
        }
        return value - 1;
      });
    }, 1000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [router]);

  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'center',padding:'12px 14px',border:'1px solid #d8dee8',borderRadius:12,background:'#f8fafc'}}>
      <strong>Live refresh: ON</strong>
      <span aria-live="polite">{isPending ? 'Refreshing latest stories…' : `Next automatic refresh in ${remaining}s`}</span>
      <button
        type="button"
        onClick={refresh}
        disabled={isPending}
        style={{marginLeft:'auto',border:'1px solid #111827',borderRadius:8,padding:'8px 12px',background:'#111827',color:'#fff',fontWeight:700,cursor:'pointer'}}
      >
        Refresh now
      </button>
    </div>
  );
}
