/* Powrót 2026 — service worker
   Apka „Wyprawy”: index.html (wszystkie wyprawy) + powroty.html (skrót do wyprawy Powrót).
   Podbij VERSION przy każdym wgraniu — inaczej przeglądarka nie zauważy zmiany.
   Tę samą liczbę wpisz w index.html w ?v= (5 miejsc). Dzięki temu nowy index.html
   nigdy nie dostanie starego app.js z pamięci. */
const VERSION = 'v62';   // ← ta sama liczba co ?v= w index.html
const Q = '?v=' + VERSION.slice(1);
const SHELL   = 'powrot-shell-' + VERSION;
const TILES   = 'powrot-tiles';   // BEZ wersji — aktualizacja apki nie kasuje zapisanych map
const MAX_TILES = 1200;

/* Leaflet siedzi w obu plikach HTML — zero zależności zewnętrznych */
const PRECACHE = [
  './',
  './index.html',
  './app.js' + Q,
  './app.css' + Q,
  './packs.js' + Q,
  './leaflet.js' + Q,
  './leaflet.css' + Q,
  './powroty.html',
  './apple-touch-icon.png',
  './icon-rihla-192.png',
  './icon-rihla-512.png',
  './icon-rihla-maskable-192.png',
  './icon-rihla-maskable-512.png',
  './manifest.webmanifest',
  './f-fraunces-latin.woff2','./f-fraunces-ext.woff2','./f-fraunces-i-latin.woff2','./f-fraunces-i-ext.woff2',
  './f-inter-latin.woff2','./f-inter-ext.woff2','./f-armenian-500.woff2','./f-armenian-700.woff2'
];
/* bez tych plików apka nie ruszy offline */
const CORE = ['./', './index.html', './app.js' + Q, './app.css' + Q, './packs.js' + Q, './leaflet.js' + Q, './leaflet.css' + Q];
/* fonty: miło mieć, ale apka działa bez nich (fallback systemowy) */
const NICE_TO_HAVE = [];  // fonty są teraz lokalne, w PRECACHE

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    // rdzeń MUSI się zapisać — jeśli coś się nie pobierze, instalacja się nie uda
    // i przeglądarka spróbuje ponownie później (stara wersja działa dalej, offline też)
    await c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })));
    // ikony, fonty, stary skrót — miło mieć, ich brak nie może zablokować aktualizacji
    await Promise.all(PRECACHE.filter(u => !CORE.includes(u)).map(u =>
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

  // 1c. pakiety z linku (packs/*.json) — najpierw sieć, żeby poprawki docierały; offline z kopii
  if (url.origin === location.origin && url.pathname.includes('/packs/')) {
    e.respondWith((async () => {
      const c = await caches.open(SHELL);
      const key = url.origin + url.pathname;
      try {
        const res = await fetch(req);
        if (res && res.ok) c.put(key, res.clone());
        return res;
      } catch (err) {
        return (await c.match(key)) || new Response('', { status: 504 });
      }
    })());
    return;
  }

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
