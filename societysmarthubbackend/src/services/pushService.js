// FCM push bhejne ka single entry point.
//
// Design:
//  - Push "best effort" hai. Fail hone par kabhi throw nahi karta, kyunki
//    in-app notification (DB row) pehle hi ban chuki hoti hai. Push ek bonus
//    delivery channel hai, source of truth nahi.
//  - User ke saare devices par jata hai (ek resident ka phone + laptop).
//  - Dead tokens (app uninstall, browser data clear) response se detect karke
//    DB se nikal dete hain, warna fcmTokens array hamesha badhta rehta hai.

import { getMessaging, isPushEnabled } from "../config/firebase.js";
import User from "../models/user.js";

// FCM ek multicast call me max 500 token leta hai.
const FCM_BATCH_LIMIT = 500;

// In error codes ka matlab token permanently dead hai — DB se hata do.
// Baaki errors (network, quota, internal) temporary hote hain, token rakhte hain.
const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

/**
 * FCM data payload me saari values string honi chahiye, warna SDK throw karta
 * hai. null/undefined keys drop kar dete hain.
 */
function toStringData(data = {}) {
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    out[key] = String(value);
  }
  return out;
}

/**
 * Jin tokens par delivery permanently fail hui, unko sabhi users se pull kar do.
 */
async function pruneDeadTokens(tokens) {
  if (tokens.length === 0) return;

  try {
    await User.updateMany(
      { fcmTokens: { $in: tokens } },
      { $pull: { fcmTokens: { $in: tokens } } },
    );
    console.log(`[fcm] ${tokens.length} dead token(s) removed`);
  } catch (err) {
    console.error("[fcm] token prune failed:", err.message);
  }
}

/**
 * Diye gaye users ke devices par push bhejo.
 *
 * @param {Array<string|object>} userIds  recipient user ids
 * @param {object} payload
 * @param {string} payload.title
 * @param {string} payload.body
 * @param {string} [payload.link]      click par frontend kahan khole (e.g. "/member")
 * @param {object} [payload.data]      extra key-value (category, type, id...)
 * @returns {Promise<{sent: number, failed: number, skipped: boolean}>}
 */
export async function sendPushToUsers(userIds, payload) {
  const result = { sent: 0, failed: 0, skipped: true };

  // [PUSH-DEBUG] Chain ka step 3: FCM layer tak pahuncha.
  console.log("[BACKEND-3] sendPushToUsers start hua for IDs:", userIds);

  if (!isPushEnabled()) {
    console.log(
      "[BACKEND-3] ERROR: isPushEnabled false hai! (Firebase credentials ka issue)",
    );
    return result;
  }

  const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
  if (ids.length === 0) return result;

  const { title, body, link, data } = payload || {};
  if (!title || !body) {
    console.warn("[fcm] push skipped — title/body missing");
    return result;
  }

  // Sirf un users ke tokens jinhone push band nahi kiya hai.
  // preferences.notifications.push ka default true hai, par purane user docs me
  // field hi nahi hoti — isliye $ne: false use kar rahe hain (missing bhi pass hoga).
  const recipients = await User.find({
    _id: { $in: ids },
    fcmTokens: { $exists: true, $ne: [] },
    "preferences.notifications.push": { $ne: false },
  }).select("_id fcmTokens");

  // [PUSH-DEBUG] DB me in users ke kitne device tokens hain. Khaali array ka
  // matlab frontend ne token register nahi kiya (notification permission deny,
  // ya push preference off).
  console.log(
    "[BACKEND-3] DB me in users ke FCM tokens mile:",
    recipients.map((u) => ({
      id: String(u._id),
      tokenCount: u.fcmTokens?.length || 0,
    })),
  );

  const tokens = [...new Set(recipients.flatMap((u) => u.fcmTokens || []))];

  console.log(
    `[BACKEND-3] Total ${tokens.length} token Firebase ko bheje jayenge.`,
  );

  if (tokens.length === 0) return result;

  result.skipped = false;

  const messaging = getMessaging();

  // Data-only message bhej rahe hain, isliye title/body bhi data me jate hain —
  // service worker inhi se notification banata hai.
  const stringData = toStringData({
    ...data,
    title,
    body,
    link: link || "",
  });

  const deadTokens = [];

  // 500 se zyada tokens ho to batch me bhejte hain.
  for (let i = 0; i < tokens.length; i += FCM_BATCH_LIMIT) {
    const batch = tokens.slice(i, i + FCM_BATCH_LIMIT);

    try {
      // DATA-ONLY message bhejte hain — `notification` key jaan-boojh kar
      // nahi daali.
      //
      // Wajah: agar payload me `notification` ho to firebase ka service
      // worker use khud display karne ki koshish karta hai, aur hamara
      // onBackgroundMessage handler bhi chalta hai — SDK version ke hisaab se
      // ya notification do baar dikhti hai ya ek baar bhi nahi. Data-only
      // bhejne se display ka pura control service worker ke paas rehta hai
      // (frontend/public/firebase-messaging-sw.js), jo deterministic hai.
      //
      // Aage agar native Android/iOS app banti hai, to tab `android.notification`
      // / `apns.payload.aps` blocks yahan add karne honge.
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        data: stringData,
        webpush: {
          headers: { Urgency: "high" },
        },
      });

      // [PUSH-DEBUG] Firebase ka asli jawab — yahan tak success aa gaya to
      // backend ka kaam pura hai, aage ka masla service worker / device ka hai.
      console.log(
        `[BACKEND-3] Firebase response: success ${response.successCount}, failed ${response.failureCount}`,
      );

      if (response.failureCount > 0) {
        console.log(
          "[BACKEND-3] Firebase errors:",
          response.responses
            .filter((r) => !r.success)
            .map((r) => ({ code: r.error?.code, message: r.error?.message })),
        );
      }

      result.sent += response.successCount;
      result.failed += response.failureCount;

      response.responses.forEach((res, idx) => {
        if (res.success) return;
        const code = res.error?.code;
        if (DEAD_TOKEN_CODES.has(code)) {
          deadTokens.push(batch[idx]);
        } else {
          console.error(`[fcm] send failed (${code}): ${res.error?.message}`);
        }
      });
    } catch (err) {
      // Pura batch fail — token dead nahi maante, ye infra/credential issue hai.
      result.failed += batch.length;
      console.error("[fcm] batch send failed:", err.message);
    }
  }

  await pruneDeadTokens(deadTokens);

  return result;
}

export default { sendPushToUsers };
