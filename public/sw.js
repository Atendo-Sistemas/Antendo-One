self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Atendo One', body: 'Há uma nova atualização na plataforma.' };
  const options = {
    body: data.body || 'Um novo frete foi publicado na plataforma.',
    icon: '/icons/atendo-one-192.png',
    badge: '/icons/atendo-one-192.png',
    data: { url: data.url || '/login' },
    vibrate: [200, 100, 200]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Atendo One - Alerta', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/login')
  );
});
