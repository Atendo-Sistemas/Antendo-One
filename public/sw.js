const CACHE_NAME = 'atendo-one-v1.8.79.2';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => Promise.all(
      ['/', '/login', '/manifest.json'].map(resource =>
        fetch(resource).then(response => {
          if (!response.ok) throw new Error(`Falha ao armazenar ${resource}: ${response.status}`);
          return cache.put(resource, response);
        }).catch(() => undefined)
      )
    ))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('atendo-one-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    const cacheKey = url.pathname === '/login' ? '/login' : '/';
    event.respondWith(
      fetch(request)
        .then(response => { const copy = response.clone(); void caches.open(CACHE_NAME).then(cache => cache.put(cacheKey, copy)); return response; })
        .catch(() => caches.match(cacheKey).then(cached => cached || caches.match('/login')))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      return response;
    }))
  );
});

self.addEventListener('push', event => {
  const raw = event.data ? event.data.text() : '';
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { body: raw }; }
  const title = String(data.title || 'Atendo One — Novo aviso').slice(0, 120);
  const body = String(data.body || 'Há uma nova atualização na plataforma.').slice(0, 500);
  const url = typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/login';
  const options = {
    body,
    icon: '/icons/atendo-one-192.png',
    badge: '/icons/atendo-one-192.png',
    tag: String(data.tag || data.freightId || 'atendo-one-notification').slice(0, 100),
    renotify: true,
    requireInteraction: Boolean(data.requireInteraction),
    data: { url, freightId: typeof data.freightId === 'string' ? data.freightId : undefined },
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || '/login';
  const targetUrl = new URL(target, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const existing = windowClients.find(client => client.url.startsWith(self.location.origin));
      if (existing) return existing.navigate(targetUrl).then(client => (client || existing).focus());
      return self.clients.openWindow(targetUrl);
    })
  );
});
