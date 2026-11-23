// Service worker de l'application « Veille mondiale » : lecture hors connexion.
const VERSION = 'veille-app-1';
const COQUILLE = ['./', 'index.html', 'manifest.webmanifest', 'icone.svg', 'icone-180.png', 'icone-192.png'];
const MAX_JOURS = 14; // rapports gardés hors connexion

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function reseauDabord(req) {
  const cache = await caches.open(VERSION);
  try {
    const rep = await fetch(req, { cache: 'no-cache' });
    if (rep.ok) {
      await cache.put(req, rep.clone());
      const vieux = (await cache.keys()).filter((r) => /\/donnees\/\d{4}-\d{2}-\d{2}\.json$/.test(r.url))
        .sort((a, b) => (a.url < b.url ? 1 : -1)).slice(MAX_JOURS);
      await Promise.all(vieux.map((r) => cache.delete(r)));
    }
    return rep;
  } catch (err) {
    const c = await cache.match(req);
    if (c) return c;
    throw err;
  }
}
async function cacheDabord(req) {
  const cache = await caches.open(VERSION);
  const c = await cache.match(req);
  if (c) return c;
  const rep = await fetch(req);
  if (rep.ok) await cache.put(req, rep.clone());
  return rep;
}
async function cacheEtMaj(req) {
  const cache = await caches.open(VERSION);
  const c = await cache.match(req, { ignoreSearch: true });
  const maj = fetch(req).then((rep) => { if (rep.ok) cache.put(req, rep.clone()); return rep; }).catch(() => c);
  return c || maj;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    if (url.hostname === 'cdn.jsdelivr.net') e.respondWith(cacheDabord(req)); // fond de carte
    return;
  }
  if (url.pathname.includes('/donnees/') || url.pathname.endsWith('/jours.json')) e.respondWith(reseauDabord(req));
  else if (url.pathname.includes('/app/')) e.respondWith(cacheEtMaj(req));
});
