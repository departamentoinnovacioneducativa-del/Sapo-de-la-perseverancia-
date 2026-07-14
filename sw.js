const CACHE_NAME = 'rana-productiva-v4'; // Versión actualizada para forzar el refresco de caché
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './sapo.jpg',
    './oriental.mp3' // Añadida la música oriental al caché para offline
];

// Evento Install: Cachear archivos principales
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Error al cachear en SW:', error);
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

// Evento Fetch: Servir desde caché (App Shell) o red
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Devolver del caché si existe, sino ir a la red
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Evento Push (Para notificaciones futuras desde servidor)
self.addEventListener('push', event => {
    const title = 'RanaProductiva';
    const options = {
        body: event.data ? event.data.text() : '¡Es hora de ser productivo!',
        icon: 'sapo.jpg'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});