/* eslint-disable no-undef */
//
// Firebase Messaging service worker — background push notifications.
//
// Ye file `public/` me hai, isliye build ke baad site root par serve hoti hai:
// https://<domain>/firebase-messaging-sw.js  — FCM isi exact path par SW
// dhoondhta hai, isliye naam aur jagah badalna nahi hai.
//
// Firebase config query params se aati hai (src/lib/pushNotifications.ts
// registration ke waqt bhejta hai). Isse config sirf .env me ek jagah rehti
// hai — yahan dobara hardcode nahi karni padti.
//
// Backend DATA-ONLY message bhejta hai (src/services/pushService.js), isliye
// notification banane ka pura kaam yahan hota hai. Isse "do baar notification"
// wala classic FCM bug nahi aata.

importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

const params = new URL(self.location).searchParams;

const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

// Naya SW turant control le le, purane version ka wait na kare.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

if (firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Tab band ya background me ho to ye chalta hai.
  messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {};

    const title = data.title || "SocietySmartHub";
    const body = data.body || "";

    self.registration.showNotification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      // Same category ke alerts ek dusre ko replace karein, stack na hon.
      tag: data.category || "general",
      renotify: true,
      // Security alerts (gate par visitor khada hai) tab tak dikhein jab tak
      // user tap na kare. Baaki notifications apne aap chali jati hain.
      requireInteraction: data.category === "visitor" || data.category === "alert",
      data: {
        link: data.link || "/",
        notificationId: data.notificationId || "",
        category: data.category || "general",
      },
    });
  });
} else {
  console.warn("[fcm-sw] Firebase config query params me nahi mili — push disabled");
}

// Notification par tap — pehle se khuli tab ko focus karo, nahi to nayi kholo.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = event.notification.data?.link || "/";
  const target = new URL(link, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Wahi page already khula hai to bas focus kar do.
      const exact = windows.find((w) => w.url === target);
      if (exact) return exact.focus();

      // App kahin aur khula hai to usi tab ko us page par le jao —
      // har notification par nayi tab kholna annoying hota hai.
      const anyTab = windows.find((w) => "focus" in w);
      if (anyTab) {
        if ("navigate" in anyTab) await anyTab.navigate(target);
        return anyTab.focus();
      }

      return self.clients.openWindow(target);
    })(),
  );
});
