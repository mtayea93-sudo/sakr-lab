/* Service Worker — معامل صقر (PWA + إشعارات FCM) */
const CACHE = 'sakr-v1';
const ASSETS = ['./','./index.html','./logo.jpeg','./iflash1800.png','./icon-192.png','./icon-512.png','./manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

/* ===== إشعارات Firebase (FCM) — شغالة لما تضيف مفتاح VAPID ===== */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
try {
  firebase.initializeApp({
    apiKey: "AIzaSyAPawpCwihRHOaPjMzhhcsSDa9WAy0Qx-Q",
    authDomain: "sakrlab2026.firebaseapp.com",
    databaseURL: "https://sakrlab2026-default-rtdb.firebaseio.com",
    projectId: "sakrlab2026",
    storageBucket: "sakrlab2026.firebasestorage.app",
    messagingSenderId: "1049726811378",
    appId: "1:1049726811378:web:0959efa43bad0f7e24e46b"
  });
  firebase.messaging().onBackgroundMessage(payload => {
    self.registration.showNotification(payload.notification.title || 'معامل صقر', {
      body: payload.notification.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      dir: 'rtl',
      lang: 'ar'
    });
  });
} catch (e) { /* Firebase مش مفعّل — السويتش بس */ }
