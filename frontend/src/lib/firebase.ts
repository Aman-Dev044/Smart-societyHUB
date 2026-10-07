// Firebase web SDK init — sirf FCM push notifications ke liye.
//
// Yahan jo config hai wo PUBLIC hai (Firebase Console → Project Settings →
// General → Your apps). Ye backend ki serviceAccountKey.json se bilkul alag
// cheez hai — service account private key kabhi frontend me nahi aani chahiye.
//
// Values .env se aati hain (VITE_FIREBASE_*). Config na ho to push chup-chaap
// disable rehta hai aur baaki app normal chalta hai.

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

// Web Push certificate ka public key — Firebase Console → Project Settings →
// Cloud Messaging → Web Push certificates.
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

/**
 * Push ke liye minimum ye teen cheezein chahiye. VAPID key ke bina getToken()
 * kaam nahi karta, isliye wo bhi zaroori hai.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      VAPID_KEY,
  );
}

/**
 * Config missing hone par kya missing hai — console me debug karne ke liye.
 */
export function missingFirebaseKeys(): string[] {
  const missing: string[] = [];
  if (!firebaseConfig.projectId) missing.push("VITE_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.messagingSenderId) missing.push("VITE_FIREBASE_MESSAGING_SENDER_ID");
  if (!firebaseConfig.appId) missing.push("VITE_FIREBASE_APP_ID");
  if (!firebaseConfig.apiKey) missing.push("VITE_FIREBASE_API_KEY");
  if (!VAPID_KEY) missing.push("VITE_FIREBASE_VAPID_KEY");
  return missing;
}

let app: FirebaseApp | null = null;

/**
 * Firebase app lazily init karta hai. getApps() check isliye ki Vite ke
 * hot-reload par dobara initialize karne se error aata hai.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (app) return app;

  app = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
  return app;
}

/**
 * Messaging instance — browser support check ke saath.
 *
 * isSupported() false return karta hai: iOS Safari (jab tak app home screen
 * par install na ho), private/incognito windows, aur purane browsers.
 * Un cases me push silently skip hota hai, app nahi tootti.
 */
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  try {
    if (!(await isSupported())) return null;
    return getMessaging(firebaseApp);
  } catch {
    return null;
  }
}
