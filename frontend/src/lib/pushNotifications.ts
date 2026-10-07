// Push notification register / unregister ka pura logic.
//
// Flow:
//   1. Service worker register karo (config query params ke saath)
//   2. Browser se notification permission maango
//   3. FCM se device token lo
//   4. Token backend ko bhejo -> User.fcmTokens me save ho jata hai
//
// Logout par token backend se aur browser se dono jagah se hata dete hain,
// warna logged-out device par bhi push aate rahenge.

import { getToken, deleteToken, onMessage, type MessagePayload } from "firebase/messaging";
import {
  firebaseConfig,
  getMessagingIfSupported,
  isFirebaseConfigured,
  missingFirebaseKeys,
  VAPID_KEY,
} from "./firebase";
import notificationService from "@/auth/notificationService";

// Current token localStorage me rakhte hain, taaki logout ke waqt (ya page
// reload ke baad) pata ho ki backend se kaunsa token hatana hai.
const TOKEN_STORAGE_KEY = "fcmToken";

export type PushResult =
  | { ok: true; token: string }
  | { ok: false; reason: string };

/**
 * Service worker register karta hai aur firebase config query params me
 * bhejta hai (SW apne andar config hardcode nahi karta).
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  // Sirf wahi keys jo SW ko chahiye. Undefined values skip ho jati hain.
  const query = new URLSearchParams(
    Object.entries(firebaseConfig).filter(([, v]) => Boolean(v)) as [string, string][],
  );

  try {
    return await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${query.toString()}`,
      { scope: "/" },
    );
  } catch (err) {
    console.error("[push] service worker register fail:", err);
    return null;
  }
}

/**
 * Push enable karo — permission maango, token lo, backend ko bhejo.
 *
 * Kabhi throw nahi karta: push ek optional feature hai, iske fail hone se
 * login ya dashboard nahi tootna chahiye.
 */
export async function enablePushNotifications(): Promise<PushResult> {
  if (!isFirebaseConfigured()) {
    return {
      ok: false,
      reason: `Firebase config missing: ${missingFirebaseKeys().join(", ")}`,
    };
  }

  if (!("Notification" in window)) {
    return { ok: false, reason: "Is browser me notifications support nahi hain" };
  }

  // Permission "denied" hai to dobara maangne ka fayda nahi — browser prompt
  // nahi dikhayega. User ko khud site settings se allow karna padega.
  if (Notification.permission === "denied") {
    return { ok: false, reason: "User ne notifications block kar diye hain" };
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: `Permission ${permission}` };
    }
  }

  const messaging = await getMessagingIfSupported();
  if (!messaging) {
    // iOS Safari (jab tak PWA install na ho), incognito, purane browsers.
    return { ok: false, reason: "Is browser/device par FCM supported nahi hai" };
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    return { ok: false, reason: "Service worker register nahi hua" };
  }

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return { ok: false, reason: "FCM ne token nahi diya" };
    }

    // Backend ka $addToSet idempotent hai, isliye dobara bhejna safe hai.
    await notificationService.registerFcmToken(token);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);

    return { ok: true, token };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[push] token lene me dikkat:", message);
    return { ok: false, reason: message };
  }
}

/**
 * Logout par call karo — token backend se aur browser se dono jagah hatao.
 *
 * Fail hone par bhi logout nahi rukna chahiye, isliye saari errors swallow
 * hoti hain. localStorage se key hamesha hat jati hai.
 */
export async function disablePushNotifications(): Promise<void> {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (stored) {
    try {
      await notificationService.unregisterFcmToken(stored);
    } catch (err) {
      console.error("[push] backend se token hatane me dikkat:", err);
    }
  }

  try {
    const messaging = await getMessagingIfSupported();
    if (messaging) await deleteToken(messaging);
  } catch (err) {
    console.error("[push] local token delete fail:", err);
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Tab khuli ho tab push service worker nahi, ye handler chalta hai.
 * Yahan browser notification nahi dikhate — in-app toast zyada natural lagta
 * hai jab user already app me hai.
 *
 * @returns unsubscribe function
 */
export function listenForForegroundMessages(
  handler: (payload: MessagePayload) => void,
): () => void {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const messaging = await getMessagingIfSupported();
    if (!messaging || cancelled) return;
    unsubscribe = onMessage(messaging, handler);
  })();

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}

/**
 * Abhi push chalu hai ya nahi (UI toggle dikhane ke liye).
 */
export function isPushActive(): boolean {
  return (
    typeof Notification !== "undefined" &&
    Notification.permission === "granted" &&
    Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
  );
}
