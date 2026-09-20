/* Service Worker — معامل صقر (PWA + إشعارات FCM)
   استراتيجية: الشبكة أولاً (Network-First) — التحديثات توصل للتطبيق المثبت فوراً
   مع كاش احتياطي لو مفيش نت */
const CACHE = 'sakr-v2';
const ASSETS = ['./','./index.html','./logo.jpeg','./iflash1800.png','./icon-192.png','./icon-512.png','./manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  /* امسح الكاشات القديمة عشان التحديثات توصل */
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      /* نجح التحميل من الشبكة: خزّن نسخة جديدة وقدّمها فوراً */
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() =>
      /* مفيش نت: قدّم من الكاش */
      caches.match(e.request).then(r => r || caches.match('./index.html'))
    )
  );
});

/* ===== إشعارات Firebase (FCM) ===== */
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
