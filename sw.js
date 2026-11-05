// Offline-first app shell. The shell is saved at install time, so the app opens with no internet.
const V = 'hisaab-v14';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, {cache: 'reload'})).catch(() => {})))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;   // Google Sheet calls are never touched
  e.respondWith((async () => {
    const c = await caches.open(V);
    const net = fetch(r, {cache: 'no-cache'}).then(res => { if (res.ok && res.type === 'basic') c.put(r, res.clone()); return res; });
    try {
      return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 3500))]);
    } catch (err) {
      net.catch(() => {});
      return (await c.match(r, {ignoreSearch: true})) ||
             (r.mode === 'navigate' ? ((await c.match('./index.html')) || (await c.match('./'))) : undefined) ||
             Response.error();
    }
  })());
});
