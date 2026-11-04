const CACHE = 'newsxphere-static-v80';
const STATIC_ASSETS = ['/', '/404.html', '/results.html', '/styles.css?v=80', '/script.js?v=80', '/jobs.css', '/orbit-bot.js', '/favicon.ico', '/favicon-dark.ico', '/favicon-restore.ico', '/public/favicon-16.png', '/public/favicon-32.png', '/public/favicon-48.png', '/public/apple-touch-icon.png', '/public/icon-192-padded.png', '/public/icon-512-padded.png', '/public/site.webmanifest', '/public/newsxphere-light-mode-logo.png', '/public/newsxphere-dark-mode-logo.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

    const url = new URL(request.url);
    if (url.pathname === '/version.json') { event.respondWith(fetch(request, {cache: 'no-store'}).catch(() => caches.match(request))); return; }
    if (url.pathname === '/allnewsdata.json' || url.pathname === '/feed.xml' || url.pathname === '/sitemap.xml') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => cache.put(request, copy));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    if (request.destination === 'style' || request.destination === 'script') {
        // v77 speed: versioned assets (?v=79) are immutable, so they
        // are cache-first: repeat visits serve script/styles instantly
        // from the service-worker cache, no network wait. A new release
        // gets a new ?v= URL, so it can never serve stale code.
        // Unversioned assets (article pages load plain script.js)
        // stay network-first, so Max Ai updates still reach them.
        if (url.searchParams.has('v')) {
            event.respondWith(
                caches.match(request).then(cached => cached || fetch(request).then(response => {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => cache.put(request, copy));
                    return response;
                }))
            );
            return;
        }
        event.respondWith(
            fetch(request).then(response => {
                const copy = response.clone();
                caches.open(CACHE).then(cache => cache.put(request, copy));
                return response;
            }).catch(() => caches.match(request))
        );
        return;
    }
    if (request.destination === 'image' || request.destination === 'font') {
        event.respondWith(
            fetch(request).then(response => {
                const copy = response.clone();
                caches.open(CACHE).then(cache => cache.put(request, copy));
                return response;
            }).catch(() => caches.match(request))
        );
    }
});
