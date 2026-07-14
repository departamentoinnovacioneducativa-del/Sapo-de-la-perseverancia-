const CACHE_NAME = 'rana-productiva-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './sapo.jpg'
];

// Evento Install: Cachear archivos principales
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Evento Activate: Limpiar cachés antiguas
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Evento Fetch: Servir desde caché (App Shell)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // Devolver de caché
                }
                return fetch(event.request); // Devolver de red
            })
    );
});

// Evento Push (Reservado para futuras notificaciones Push del servidor)
self.addEventListener('push', event => {
    const title = 'RanaProductiva';
    const options = {
        body: event.data ? event.data.text() : '¡Es hora de ser productivo!',
        icon: 'sapo.jpg'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});