const SHELL = 'kindlf-v2';
const FILES = ['./', './index.html', './styles.css', './app.js', './books.example.json', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== 'covers').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 表紙は一度取ったら持っておく。オフラインでも棚が埋まる
  if (url.hostname === 'm.media-amazon.com') {
    e.respondWith(caches.open('covers').then(async cache => {
      const hit = await cache.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    }));
    return;
  }

  if (url.origin !== location.origin) return;

  // 自前のファイルはネットワーク優先。落ちたらキャッシュ。
  // no-store を付けないとブラウザのHTTPキャッシュが先に応え、更新が届かない
  e.respondWith(fetch(e.request, { cache: 'no-store' })
    .then(res => {
      const copy = res.clone();
      caches.open(SHELL).then(c => c.put(e.request, copy));
      return res;
    })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
