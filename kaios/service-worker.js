const CACHE_NAME = 'workpads-cache-v4'; // Increment cache version due to local Dexie.js
const urlsToCache = [
  '/',
  '/index.html',
  '/edit-workpad.html',
  '/workpad.html', // The individual workpad view page
  '/viewer.html', // Retained as per user request
  '/style.css',
  '/index-script.js', // Script for index.html
  '/edit-script.js',  // Script for edit-workpad.html
  '/workpad-script.js', // Script for workpad.html
  '/assets/js/pako.min.js',
  '/assets/js/dexie.min.js', // Now caching the local Dexie.js file
  '/icons/icon-56.png',
  '/icons/icon-112.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache all URLs during install:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // If not in cache, fetch from network
        return fetch(event.request).catch((error) => {
          console.error('Fetch failed for:', event.request.url, error);
          // You might want to return a fallback page for offline users here
          // For example: return caches.match('/offline.html');
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that are not in the whitelist
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
