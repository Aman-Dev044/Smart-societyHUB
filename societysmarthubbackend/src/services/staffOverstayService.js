import cron from "node-cron";

import StaffAttendance from "../models/StaffAttendance.js";
import Visitor from "../models/Visitor.js";
import User from "../models/user.js";
import { createNotification } from "../controllers/notificationController.js";
import {
  STAFF_OVERSTAY_HOURS,
  ONE_TIME_OVERSTAY_HOURS,
  MIN_OVERSTAY_MS,
  STAFF_OVERSTAY_CRON,
  STAFF_OVERSTAY_MAX_AGE_MS,
  hoursInside,
  isOneTimeStaff,
  isOverstay,
  overstayMsFor,
  overstayHoursFor,
  isVisitorOverstay,
  minsOverstayed,
} from "../config/staffOverstay.js";

// Society-wise guard list ka chhota per-run cache, taaki ek hi society ke
// multiple overstay records par baar-baar User query na chale.
async function buildGuardCache() {
  const cache = new Map();

  return async (societyId) => {
    const key = String(societyId);
    if (cache.has(key)) return cache.get(key);

    const guards = await User.find({
      society: societyId,
      role: { $regex: /^guard$/i },
      isActive: true,
    }).select("_id");

    cache.set(key, guards);
    return guards;
  };
}

/**
 * Un staff ko dhoondho jo entry ke baad apne threshold se zyada der se andar
 * hain aur jinka exit mark nahi hua, phir us society ke har guard ko ek
 * security alert bhejo.
 *
 * Daily aur One-time (technician / delivery) dono cover hote hain, par
 * threshold alag ho sakta hai (STAFF_OVERSTAY_HOURS vs ONE_TIME_OVERSTAY_HOURS).
 *
 * Har attendance record par alert sirf ek baar jata hai (overstayAlertedAt),
 * isliye cron ke har tick par guard ko spam nahi hota.
 *
 * @returns {Promise<{scanned: number, alerted: number}>}
 */
export async function runStaffOverstayCheck() {
  const now = new Date();

  // Query ka cutoff dono thresholds me se chhota hai, warna jis type ka
  // threshold kam hai uske records yahin chhoot jate. Exact check niche
  // per-record hota hai.
  const cutoff = new Date(now.getTime() - MIN_OVERSTAY_MS);
  const staleFloor = new Date(now.getTime() - STAFF_OVERSTAY_MAX_AGE_MS);

  // Open attendance records: entry ho chuki, exit nahi, alert abhi tak nahi bheja.
  // Kal raat ke un-closed records bhi aate hain, par STAFF_OVERSTAY_MAX_AGE_MS
  // se purane abandoned records skip ho jate hain.
  const openRecords = await StaffAttendance.find({
    entryTime: { $gte: staleFloor, $lte: cutoff },
    exitTime: null,
    overstayAlertedAt: null,
  })
    .populate({
      path: "staff",
      select:
        "staffName role flatNumber flatNumbers staffType status purpose description",
    })
    .limit(500);

  if (openRecords.length === 0) {
    return { scanned: 0, alerted: 0 };
  }

  const guardsFor = await buildGuardCache();
  let alerted = 0;

  for (const record of openRecords) {
    const staff = record.staff;

    // staff null ho sakta hai agar Staff doc delete ho chuka ho
    // (orphan attendance record).
    if (!staff) continue;

    // Threshold staff type ke hisaab se alag hai, isliye DB query ke baad
    // yahan exact check karna zaroori hai.
    if (!isOverstay(record, now, overstayMsFor(staff))) continue;

    const guards = await guardsFor(record.society);
    if (guards.length === 0) continue;

    const insideFor = hoursInside(record.entryTime, now);
    const entryLabel = new Date(record.entryTime).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });

    const flats = staff.flatNumbers?.length
      ? staff.flatNumbers.join(", ")
      : staff.flatNumber;

    const oneTime = isOneTimeStaff(staff);

    // One-time entry me naam optional hai (gate par sirf photo + purpose
    // liya jata hai), isliye naam na ho to purpose se identify karte hain.
    const message = oneTime
      ? `${staff.staffName || staff.purpose} (${staff.purpose}) flat ${flats} ke liye ` +
        `${entryLabel} par andar aaya tha aur ${insideFor} hrs se andar hai ` +
        `(allowed ${overstayHoursFor(staff)} hrs). Exit abhi tak mark nahi hua.`
      : `${staff.staffName} (${staff.role}) ne ${entryLabel} par entry ki thi aur ` +
        `${insideFor} hrs se society ke andar hai. Exit abhi tak mark nahi hua. ` +
        `Flat: ${flats}.`;

    for (const guard of guards) {
      await createNotification({
        recipient: guard._id,
        society: record.society,
        title: oneTime
          ? "Security Alert: Technician Overstay"
          : "Security Alert: Staff Overstay",
        message,
        category: "alert",
        type: "warning",
        targetAudience: "specific",
        link: "/daily-staff",
      }).catch((err) =>
        console.error("Overstay notification error:", err.message),
      );
    }

    // Alert bhejne ke baad hi mark karo, taaki notification fail hone par
    // agle tick me dobara try ho.
    record.overstayAlertedAt = now;
    await record.save();
    alerted += 1;
  }

  return { scanned: openRecords.length, alerted };
}

/**
 * [POINT 3] Approved gate visitors / technicians jo resident ke diye hue
 * duration se zyada der andar hain, un par guard ko overstay alert bhejo.
 *
 * Staff wale check se alag isliye hai ki yahan threshold per-visitor hota hai
 * (resident ne approve karte waqt jo duration chuna tha).
 *
 * @returns {Promise<{scanned: number, alerted: number}>}
 */
export async function runVisitorOverstayCheck() {
  const now = new Date();
  const staleFloor = new Date(now.getTime() - STAFF_OVERSTAY_MAX_AGE_MS);

  // Andar maujood approved visitors jinka alert abhi nahi gaya.
  // Threshold per-visitor hai, isliye filter JS me hota hai.
  const inside = await Visitor.find({
    status: "Approved",
    entryTime: { $gte: staleFloor, $ne: null },
    exitTime: null,
    overstayAlertedAt: null,
  })
    .select(
      "visitorName visitorPhone purpose flatNumber vehicleNumber society entryTime exitTime status allowedDurationMins",
    )
    .limit(500);

  if (inside.length === 0) {
    return { scanned: 0, alerted: 0 };
  }

  const guardsFor = await buildGuardCache();
  let alerted = 0;

  for (const visitor of inside) {
    if (!isVisitorOverstay(visitor, now)) continue;

    const guards = await guardsFor(visitor.society);
    if (guards.length === 0) continue;

    const over = minsOverstayed(visitor, now);
    const vehicleLine = visitor.vehicleNumber
      ? ` Vehicle: ${visitor.vehicleNumber}.`
      : "";

    const message =
      `${visitor.visitorName} (${visitor.purpose}) flat ${visitor.flatNumber} ` +
      `ke liye andar hai. Allowed ${visitor.allowedDurationMins} min tha, ` +
      `${over} min zyada ho gaye. Exit abhi tak mark nahi hua.${vehicleLine}`;

    for (const guard of guards) {
      await createNotification({
        recipient: guard._id,
        society: visitor.society,
        title: "Security Alert: Visitor Overstay",
        message,
        category: "alert",
        type: "warning",
        targetAudience: "specific",
        link: "/daily-staff",
      }).catch((err) =>
        console.error("Visitor overstay notification error:", err.message),
      );
    }

    visitor.overstayAlertedAt = now;
    await visitor.save();
    alerted += 1;
  }

  return { scanned: inside.length, alerted };
}

/**
 * Cron ko server start par register karta hai.
 */
export function startStaffOverstayCron() {
  cron.schedule(STAFF_OVERSTAY_CRON, async () => {
    try {
      const staff = await runStaffOverstayCheck();
      if (staff.alerted > 0) {
        console.log(`[overstay] ${staff.alerted} staff overstay alert(s) sent`);
      }
    } catch (err) {
      console.error("[overstay] staff check failed:", err.message);
    }

    try {
      const visitors = await runVisitorOverstayCheck();
      if (visitors.alerted > 0) {
        console.log(
          `[overstay] ${visitors.alerted} visitor overstay alert(s) sent`,
        );
      }
    } catch (err) {
      console.error("[overstay] visitor check failed:", err.message);
    }
  });

  console.log(
    `[overstay] cron registered (${STAFF_OVERSTAY_CRON}, daily staff ${STAFF_OVERSTAY_HOURS}h, ` +
      `one-time ${ONE_TIME_OVERSTAY_HOURS}h)`,
  );
}
