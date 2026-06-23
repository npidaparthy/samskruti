const CACHE = 'stotram-v1'; // bumped automatically by CI using git commit hash
const ASSETS = [
    '/', '/index.html', '/manifest.json',
    '/assets/css/main.css',
    '/assets/js/constants.js',
    '/assets/js/app.js',
    '/assets/js/modules/i18n.js',
    '/assets/js/modules/settings.js',
    '/assets/js/modules/parser.js',
    '/assets/js/modules/audio.js',
    '/assets/js/modules/search.js',
    '/assets/js/modules/ui.js',
    '/data/stotrams.json',
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});