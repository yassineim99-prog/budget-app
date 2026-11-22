// Nisba service worker: offline support + bill reminders.
const CACHE = 'nisba-v4';
const DATA = 'nisba-data';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'help-sync.html', 'help-split.html', 'lang/keys.json', 'vendor/fonts.css', 'vendor/confetti.browser.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.endsWith('/api/data') || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});

/* ---------- reminders: the app saves upcoming bills here; we notify for today and tomorrow, once each ---------- */
const local = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
async function readJSON(name, fallback) { try { const r = await (await caches.open(DATA)).match(name); return r ? await r.json() : fallback; } catch { return fallback; } }
async function writeJSON(name, value) { const c = await caches.open(DATA); await c.put(name, new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } })); }
async function remind() {
  const data = await readJSON('reminders.json', { on: false, items: [] });
  if (!data.on || self.Notification?.permission === 'denied') return;
  const sent = new Set(await readJSON('sent.json', []));
  const now = new Date(), today = local(now), tomorrow = local(new Date(now.getTime() + 864e5));
  for (const it of data.items) {
    if ((it.date !== today && it.date !== tomorrow) || sent.has(it.key)) continue;
    await self.registration.showNotification(it.date === today ? (it.today || `${it.name} is due today`) : (it.tomorrow || `${it.name} is due tomorrow`), {
      body: it.body || `${it.amount} · tap to open Nisba`, icon: 'icon-192.png', badge: 'icon-192.png', tag: it.key, data: { url: './' }
    });
    sent.add(it.key);
  }
  await writeJSON('sent.json', [...sent].slice(-300));
}
self.addEventListener('periodicsync', e => { if (e.tag === 'nisba-reminders') e.waitUntil(remind()); });
self.addEventListener('message', e => { if (e.data === 'remind-now') e.waitUntil(remind()); });
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => ws.length ? ws[0].focus() : self.clients.openWindow('./')));
});
