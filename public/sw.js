// Minimal service worker for the Webfit News TWA/PWA shell.
// Deliberately NOT a caching proxy for article content — the site is
// server-rendered and always fetched fresh. This SW only exists to:
//   1. Make the site installable (a required PWA/TWA criterion).
//   2. Show a friendly offline page instead of Chrome's default dino
//      when the device has no connection at all.

const OFFLINE_URL = '/offline.html';
const CACHE_NAME = 'webfit-news-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intervene on top-level navigations; let every other request
  // (API calls, images, Supabase, Stripe, GA) go straight to the network.
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});
