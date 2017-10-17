var CACHE_NAME = 'buddhabrot-2017-10-17-2';
var urlsToCache = [
  '.',
  '/',
  '/main.js',
  '/material-components-web.min.css',
  '/material-components-web.min.js',
  '/rust-logo-blk.svg',
  '/rustybrot.asmjs.js',
  '/rustybrot.wasm',
  '/rustybrot.wasm.js',
  '/worker-compositor.js',
  '/worker-producer.js',
  '/manifest.json',
  '/icon.png'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

this.addEventListener('activate', function(event) {
  var cacheWhitelist = ['buddhabrot-2017-10-17-2'];

  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (cacheWhitelist.indexOf(key) === -1) {
          return caches.delete(key);
        }
      }));
    })
  );
});