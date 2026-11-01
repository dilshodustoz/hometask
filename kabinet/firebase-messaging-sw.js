// Kabinet: telefon bildirishnomalari (Firebase Cloud Messaging). Ilova yopiq bo'lsa ham xabarni ko'rsatadi.
importScripts("../class/fb/firebase-app-compat.js", "../class/fb/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey: "AIzaSyBiXp24U4XhvNDxhgf5PABDVfzBJdgc8yg",
  authDomain: "dilshod-ielts-class.firebaseapp.com",
  projectId: "dilshod-ielts-class",
  storageBucket: "dilshod-ielts-class.firebasestorage.app",
  messagingSenderId: "677688345891",
  appId: "1:677688345891:web:237b9e23b65c71ae243896"
});
const messaging = firebase.messaging();
// Xabarda "notification" bor: Firebase uni o'zi ko'rsatadi (ovoz telefonning odatiy bildirishnoma ovozi), bosilganda kabinet ochiladi.
messaging.onBackgroundMessage(function () {});
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
