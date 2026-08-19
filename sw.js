const CACHE_NAME = 'fokuspro-v3';
const APP_SHELL = [
  './index.html',
  './login.html',
  './course.html',
  './habit.html',
  './web.html',
  './indonesia.html',
  './jepang.html',
  './timer-dashboard.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const isHTML =
    e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // Network-first untuk halaman HTML: begitu ada deploy baru, langsung kepakai.
    // Kalau lagi offline / gagal fetch, baru jatuh ke cache sebagai cadangan.
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Aset statis (CSS/JS/gambar/manifest dll): cache-first biar cepat & tetap bisa offline,
  // tapi tetap di-refresh di background supaya nggak selamanya nyangkut di versi lama.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
