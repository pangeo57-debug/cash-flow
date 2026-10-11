const CACHE = 'cashflow-v4'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './manifest.webmanifest', './icon-192.png'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
  self.clients.claim()
})

// Pages (HTML) are network-first so a new deploy shows immediately; if the network is
// slow (>3s) or offline, fall back to the cached copy. Hashed assets are cache-first.
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  const isPage = req.mode === 'navigate' || req.destination === 'document' || req.url.endsWith('/sw.js') || req.url.endsWith('.webmanifest')
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req)
      const fresh = () =>
        fetch(req, { cache: 'no-cache' }).then((res) => {
          if (res.ok) cache.put(req, res.clone())
          return res
        })
      if (isPage) {
        const fallback = cached || (await cache.match('./'))
        return Promise.race([fresh(), new Promise((r) => setTimeout(() => r(fallback), 3000))]).then((r) => r || fresh()).catch(() => fallback)
      }
      return cached || fresh()
    }),
  )
})
