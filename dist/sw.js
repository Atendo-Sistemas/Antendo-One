const CACHE_NAME = 'atendo-one-v1.8.43';

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['/','/login','/manifest.json'])));
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('atendo-one-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    const cacheKey = url.pathname === '/login' ? '/login' : '/';
    event.respondWith(
      fetch(request)
        .then(response => { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(cacheKey, copy)); return response; })
        .catch(() => caches.match(cacheKey).then(cached => cached || caches.match('/login')))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      return response;
    }))
  );
});

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Atendo One', body: 'Há uma nova atualização na plataforma.' };
  const options = {
    body: data.body || 'Um novo frete foi publicado na plataforma.',
    icon: '/icons/atendo-one-192.png',
    badge: '/icons/atendo-one-192.png',
    data: { url: data.url || '/login' },
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Atendo One - Alerta', options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/login'));
});
