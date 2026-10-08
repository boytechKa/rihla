/* Powrót 2026 — service worker
   Apka „Wyprawy”: index.html (wszystkie wyprawy) + powroty.html (skrót do wyprawy Powrót).
   Podbij VERSION przy każdym wgraniu — inaczej przeglądarka nie zauważy zmiany. */
const VERSION = 'v15';
const SHELL   = 'powrot-shell-' + VERSION;
const TILES   = 'powrot-tiles';   // BEZ wersji — aktualizacja apki nie kasuje zapisanych map
const MAX_TILES = 1200;

/* Leaflet siedzi w obu plikach HTML — zero zależności zewnętrznych */
const PRECACHE = [
  './',
  './index.html',
  './powroty.html',
  './apple-touch-icon.png',
  './icon-rihla-192.png'
];
/* fonty: miło mieć, ale apka działa bez nich (fallback systemowy) */
const NICE_TO_HAVE = [
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Inter:wght@400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    // własne pliki muszą się zapisać — to one decydują o offline
    await Promise.all(PRECACHE.map(u =>
      c.add(new Request(u, { cache: 'reload' })).catch(() => {})
    ));
    // fonty best-effort: brak sieci lub blokada CDN nie może wywalić instalacji
    await Promise.all(NICE_TO_HAVE.map(u =>
      c.add(new Request(u, { mode: 'cors' })).catch(() =>
        c.add(new Request(u, { mode: 'no-cors' })).catch(() => {}))
    ));
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('powrot-') && k !== SHELL && k !== TILES)
                          .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'CACHE_INFO') {
    e.waitUntil((async () => {
      const t = await caches.open(TILES);
      const n = (await t.keys()).length;
      const s = await caches.open(SHELL);
      const m = (await s.keys()).length;
      (await self.clients.matchAll()).forEach(c =>
        c.postMessage({ type: 'CACHE_INFO', tiles: n, shell: m, version: VERSION }));
    })());
  }
  if (e.data === 'CLEAR_TILES') {
    e.waitUntil((async () => {
      await caches.delete(TILES);
      (await self.clients.matchAll()).forEach(c => c.postMessage({ type: 'CACHE_INFO', tiles: 0 }));
    })());
  }
});

async function trimTiles(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_TILES) return;
  // usuń najstarsze (kolejność wstawiania)
  const over = keys.length - MAX_TILES;
  for (let i = 0; i < over; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 1. kafelki mapy — najpierw cache, potem sieć
  if (/tile\.openstreetmap\.org$/.test(url.hostname)) {
    e.respondWith((async () => {
      const c = await caches.open(TILES);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) { c.put(req, res.clone()); trimTiles(c); }
        return res;
      } catch (err) {
        return new Response('', { status: 504, statusText: 'offline tile' });
      }
    })());
    return;
  }

  // 1b. pogoda, kursy walut, wyszukiwanie miejsc — zawsze z sieci;
  //     apka sama trzyma ostatni wynik, żeby działał offline
  if (/(^|\.)open-meteo\.com$|(^|\.)er-api\.com$/.test(url.hostname)) return;

  // 2. nawigacja (wejście na stronę) — sieć, a gdy jej nie ma: zapisana kopia
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(SHELL);
      try {
        const res = await fetch(req);
        // zapisz POD WŁASNYM adresem, żeby każda apka miała swoją kopię
        c.put(req, res.clone());
        return res;
      } catch (err) {
        // offline: najpierw dokładnie ta strona, którą otwierasz
        return (await c.match(req, { ignoreSearch: true })) ||
               (await c.match(url.pathname)) ||
               (await c.match('./index.html')) || (await c.match('./')) ||
               new Response('<h1>Brak sieci i brak zapisanej kopii</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // 3. reszta (Leaflet, fonty, czcionki gstatic) — najpierw cache
  e.respondWith((async () => {
    const c = await caches.open(SHELL);
    const hit = await c.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
      return res;
    } catch (err) {
      return hit || new Response('', { status: 504 });
    }
  })());
});
