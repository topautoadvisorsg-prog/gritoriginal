// Service Worker for Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const title = data.title || 'GRIT Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/badge.png',
    tag: data.tag || 'grit-notification',
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: {
      url: data.url || '/dashboard'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if no existing one found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
