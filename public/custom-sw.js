// Custom Service Worker for TimeBlock PWA
// Handles push notifications and background sync

const CACHE_NAME = 'timeblock-v1';

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: 'TimeBlock',
    body: 'You have a task starting now!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'timeblock-notification',
    requireInteraction: true,
    data: data.data || { url: '/' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// Message handler for alarm scheduling
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SCHEDULE_ALARM') {
    const { block, delay } = event.data;
    
    // Schedule notification
    setTimeout(() => {
      self.registration.showNotification('TimeBlock - Time\'s Up!', {
        body: `"${block.title}" starts now (${block.startTime})`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: `block-${block.id}`,
        requireInteraction: true,
        data: {
          blockId: block.id,
          url: '/',
        },
      });
    }, delay);
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, data } = event.data;
    
    self.registration.showNotification(title || 'TimeBlock', {
      body: body || 'You have a task!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: tag || 'timeblock-notification',
      requireInteraction: true,
      data: data || { url: '/' },
    });
  }
});

// Skip waiting and claim clients immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing custom service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating custom service worker...');
  event.waitUntil(clients.claim());
});
