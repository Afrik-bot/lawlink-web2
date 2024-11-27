/* eslint-disable no-restricted-globals */

// Cache name for PWA
const CACHE_NAME = 'lawlink-v1';

// Listen for push notifications
self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: data.data || {},
      actions: data.actions || [],
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      renotify: true
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'LawLink Notification', options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Handle notification action clicks
  if (event.action) {
    // Handle specific actions here
    console.log('Notification action clicked:', event.action);
    return;
  }

  // Default click behavior - open the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/logo192.png',
        '/logo512.png'
      ]);
    })
  );
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle fetch events for offline support
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
