const CACHE_NAME = 'walktogive-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/animations.css',
  '/css/layout.css',
  '/css/components.css',
  '/js/app.js',
  '/js/config/supabase.js',
  '/js/utils/validation.js',
  '/js/utils/formatters.js',
  '/js/utils/helpers.js',
  '/js/services/auth.service.js',
  '/js/services/workout.service.js',
  '/js/services/badge.service.js',
  '/js/services/friend.service.js',
  '/js/services/movement.service.js',
  '/js/components/calendar.js',
  '/js/components/modal.js',
  '/js/components/stats.js',
  '/js/components/badges.js',
  '/js/components/navigation.js',
  '/js/components/settings.js',
  '/js/pages/friends.js',
  '/js/pages/movements.js',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('🚀 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Network failed, try to return a cached offline page
          return caches.match('/index.html');
        });
      })
  );
});

// Background sync for pending data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-workouts') {
    console.log('🔄 Syncing pending workouts...');
    event.waitUntil(syncPendingWorkouts());
  }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('WalkToGive', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to sync pending workouts (placeholder)
async function syncPendingWorkouts() {
  // This will be implemented when Supabase backend is connected
  // For now, data is already in localStorage
  console.log('✅ Workouts synced (localStorage)');
  return Promise.resolve();
}
