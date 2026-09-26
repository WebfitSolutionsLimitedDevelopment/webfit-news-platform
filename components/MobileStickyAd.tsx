'use client';

import { useState, type ReactNode } from 'react';

export function MobileStickyAd({children}:{children:ReactNode}){
  const [dismissed,setDismissed]=useState(false);
  if(dismissed||!children)return null;
  return <div className="mobile-sticky-ad">
    {children}
    <button type="button" className="mobile-sticky-ad-close" aria-label="Close advertisement" onClick={()=>setDismissed(true)}>×</button>
  </div>;
}
