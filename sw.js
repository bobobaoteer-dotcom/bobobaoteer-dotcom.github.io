const CACHE = 'pet-life-shell-v26';
const SHELL = ['/', '/index.html', '/life.css', '/life-care.css', '/album.css', '/life-app.js', '/album.js', '/first-use.js', '/account-ui.js', '/local-scope.js', '/backup-crypto.js', '/backup-service.js', '/life-ui.js', '/life-care.js', '/ui-config.js', '/layout-editor.js', '/db.js', '/assets/inter-latin.woff2', '/assets/life/hero.webp', '/assets/life/community-walk.webp', '/assets/life/community-home.webp', '/assets/life/grooming.webp', '/icon.svg', '/manifest.webmanifest'];
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('pet-') && key !== CACHE).map(key => caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch', event => {
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/studio/')||url.pathname.startsWith('/v1/')||url.pathname==='/health')return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));}return response;}).catch(async()=>await caches.match(event.request)||Response.error()));
});
