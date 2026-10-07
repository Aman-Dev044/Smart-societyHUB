// Firebase Admin SDK init — FCM push notifications ke liye.
//
// Credentials teen jagah se load ho sakti hain (isi priority me):
//   1. FIREBASE_SERVICE_ACCOUNT       -> pura JSON ek env var me (raw ya base64).
//                                        Live server ke liye best — file upload nahi karni padti.
//   2. FIREBASE_SERVICE_ACCOUNT_PATH  -> custom file path.
//   3. <backend-root>/serviceAccountKey.json  -> local development ka default.
//
// Key na mile to app crash NAHI hota: push silently skip ho jata hai aur
// baaki pura system (in-app notifications, DB, API) normal chalta rehta hai.
// Isse local dev aur CI me Firebase credentials optional rehti hain.
//
// NOTE: firebase-admin v14 me modular API use karni padti hai
// (`firebase-admin/app`, `firebase-admin/messaging`) — purane
// `admin.credential.cert()` / `admin.messaging()` wale namespaces
// default ESM export par maujood nahi hain.

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging as getFcmMessaging } from "firebase-admin/messaging";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// src/config/firebase.js -> do level upar backend root hai.
const BACKEND_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_KEY_PATH = path.join(BACKEND_ROOT, "serviceAccountKey.json");

// Named app, taaki kisi aur default app se takkar na ho aur nodemon ke
// hot-reload par dobara initialize karne ki koshish na ho.
const APP_NAME = "society-fcm";

let app = null;
let initTried = false;
let disabledReason = null;

/**
 * Env var se service account padho. Deploy platforms (Render, Railway, Heroku)
 * par multi-line private key paste karna tootta hai, isliye base64 bhi
 * support karte hain.
 */
function fromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw?.trim()) return null;

  const text = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");

  const parsed = JSON.parse(text);

  // Kuch platforms env var me "\n" ko literal backslash-n rakh dete hain.
  // Us case me PEM invalid ho jati hai, isliye wapas real newline banate hain.
  if (parsed.private_key?.includes("\\n")) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return { creds: parsed, source: "FIREBASE_SERVICE_ACCOUNT env var" };
}

/**
 * File se service account padho.
 */
function fromFile() {
  const custom = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  const keyPath = custom
    ? path.isAbsolute(custom)
      ? custom
      : path.resolve(BACKEND_ROOT, custom)
    : DEFAULT_KEY_PATH;

  if (!fs.existsSync(keyPath)) return null;

  return {
    creds: JSON.parse(fs.readFileSync(keyPath, "utf8")),
    source: path.relative(BACKEND_ROOT, keyPath) || keyPath,
  };
}

/**
 * Firebase app ko lazily initialize karta hai. Pehli call par hi kaam karta
 * hai, uske baad cached app return hota hai (ya null agar creds nahi mili).
 */
function getApp() {
  if (initTried) return app;
  initTried = true;

  try {
    // Nodemon restart par module cache clear ho jata hai par firebase ka
    // internal registry reh sakta hai — already-initialized app reuse karo.
    const existing = getApps().find((a) => a.name === APP_NAME);
    if (existing) {
      app = existing;
      return app;
    }

    const loaded = fromEnv() || fromFile();

    if (!loaded) {
      disabledReason =
        `service account nahi mila (FIREBASE_SERVICE_ACCOUNT env var ya ` +
        `${path.basename(DEFAULT_KEY_PATH)} file)`;
      console.warn(`[fcm] push disabled — ${disabledReason}`);
      return null;
    }

    const { creds, source } = loaded;

    if (!creds.project_id || !creds.private_key || !creds.client_email) {
      disabledReason = `${source} me project_id / private_key / client_email missing hai`;
      console.warn(`[fcm] push disabled — ${disabledReason}`);
      return null;
    }

    app = initializeApp(
      {
        credential: cert(creds),
        projectId: creds.project_id,
      },
      APP_NAME,
    );

    console.log(`[fcm] initialized — project "${creds.project_id}" (${source})`);
    return app;
  } catch (err) {
    disabledReason = err.message;
    console.error(`[fcm] init failed — ${err.message}`);
    return null;
  }
}

/**
 * Push bhejne ke liye ready hai ya nahi.
 */
export function isPushEnabled() {
  return getApp() !== null;
}

/**
 * Push kyun band hai (health endpoint / debugging ke liye).
 * Credentials kabhi return nahi karta — sirf flag aur reason.
 */
export function getPushStatus() {
  const instance = getApp();
  return instance
    ? { enabled: true, projectId: instance.options.projectId }
    : { enabled: false, reason: disabledReason };
}

/**
 * FCM messaging instance. Credentials na hone par null.
 */
export function getMessaging() {
  const instance = getApp();
  return instance ? getFcmMessaging(instance) : null;
}

export default { isPushEnabled, getPushStatus, getMessaging };
