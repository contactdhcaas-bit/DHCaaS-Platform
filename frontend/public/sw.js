self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('dhcaas-v1').then((cache) => cache.addAll([
      '/',
      '/dashboard',
      '/upload',
      '/jobs',
      '/incidents'
    ]))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
