'use client';

import { useEffect, useState } from 'react';

/** How long a reader reads before any pop-up or Google ad may appear. */
export const READING_DELAY_MS = 10_000;

/**
 * True once the reader has been on the page for READING_DELAY_MS with the tab
 * visible (time in a background tab doesn't count) and has scrolled, tapped or
 * pressed a key at least once. Until then the page shows only the story and
 * the ads booked into fixed spots on it.
 *
 * Why both: the timer keeps the opening seconds clean, so the reader sees the
 * headline before any ad; the interaction keeps Google's late-inserted ads from
 * shoving the story down (layout shift), as the earlier first-interaction rule did.
 */
export function useReadingGate(enabled = true, delayMs = READING_DELAY_MS) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!enabled || ready) return;
    let readMs = 0;
    let since = document.visibilityState === 'visible' ? performance.now() : null;
    let interacted = window.scrollY > 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const events = ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const;

    const elapsed = () => readMs + (since == null ? 0 : performance.now() - since);
    const check = () => {
      clearTimeout(timer);
      const left = delayMs - elapsed();
      if (left <= 0 && interacted) { cleanup(); setReady(true); return; }
      // Time not up yet: check again when it is (only while the tab is visible).
      if (left > 0 && since != null) timer = setTimeout(check, left + 20);
    };
    const onInteract = () => { if (!interacted) { interacted = true; check(); } };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') { if (since == null) since = performance.now(); }
      else if (since != null) { readMs += performance.now() - since; since = null; }
      check();
    };
    const cleanup = () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, onInteract));
      document.removeEventListener('visibilitychange', onVisibility);
    };

    events.forEach(e => window.addEventListener(e, onInteract, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);
    check();
    return cleanup;
  }, [enabled, delayMs, ready]);
  return ready;
}
