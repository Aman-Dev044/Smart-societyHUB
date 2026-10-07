// Daily staff overstay / overtime rule.
// Agar koi Daily staff entry ke baad itne ghante tak andar hai aur exit
// mark nahi hua, to guard ko security alert bhejo.
export const STAFF_OVERSTAY_HOURS = Number(process.env.STAFF_OVERSTAY_HOURS) || 4;

export const STAFF_OVERSTAY_MS = STAFF_OVERSTAY_HOURS * 60 * 60 * 1000;

// One-time (technician / delivery) ke liye alag threshold.
// Default wahi hai jo daily staff ka hai, par technician ka kaam lamba ho
// sakta hai (AC repair, furniture assembly), isliye alag se tune kar sakte hain.
export const ONE_TIME_OVERSTAY_HOURS =
  Number(process.env.ONE_TIME_OVERSTAY_HOURS) || STAFF_OVERSTAY_HOURS;

export const ONE_TIME_OVERSTAY_MS = ONE_TIME_OVERSTAY_HOURS * 60 * 60 * 1000;

// Cron ki DB query ka cutoff. Dono thresholds me se CHHOTA lena zaroori hai,
// warna jis type ka threshold kam hai uske records query se hi chhoot jayenge.
// Exact per-record check JS me hota hai (overstayMsFor se).
export const MIN_OVERSTAY_MS = Math.min(STAFF_OVERSTAY_MS, ONE_TIME_OVERSTAY_MS);

// Itne ghante se purane open records par alert nahi bhejte. Ye abandoned
// records hote hain (guard exit mark karna bhool gaya) — un par "3000 hrs
// inside" ka alert actionable nahi, sirf noise hai.
export const STAFF_OVERSTAY_MAX_AGE_HOURS =
  Number(process.env.STAFF_OVERSTAY_MAX_AGE_HOURS) || 48;

export const STAFF_OVERSTAY_MAX_AGE_MS =
  STAFF_OVERSTAY_MAX_AGE_HOURS * 60 * 60 * 1000;

// [POINT 3] Gate visitor / technician ko resident kitni der ke liye access de.
// Resident approve karte waqt choose karta hai; na chune to ye standard time.
export const DEFAULT_VISIT_DURATION_MINS =
  Number(process.env.DEFAULT_VISIT_DURATION_MINS) || 120;

// Upper bound, taaki galti se 10 din ka access na ban jaye.
export const MAX_VISIT_DURATION_MINS =
  Number(process.env.MAX_VISIT_DURATION_MINS) || 1440;

// Ek approved visitor abhi overstay me hai ya nahi.
export function isVisitorOverstay(visitor, now = new Date()) {
  if (!visitor || visitor.status !== "Approved") return false;
  if (!visitor.entryTime || visitor.exitTime) return false;
  const mins = visitor.allowedDurationMins || DEFAULT_VISIT_DURATION_MINS;
  return now - new Date(visitor.entryTime) > mins * 60 * 1000;
}

// Visitor ko allowed time se kitne minute zyada hue (0 agar overstay nahi).
export function minsOverstayed(visitor, now = new Date()) {
  if (!visitor?.entryTime || visitor.exitTime) return 0;
  const mins = visitor.allowedDurationMins || DEFAULT_VISIT_DURATION_MINS;
  const over = (now - new Date(visitor.entryTime)) / 60000 - mins;
  return over > 0 ? Math.round(over) : 0;
}

// Har 15 minute par pending overstay check hota hai.
export const STAFF_OVERSTAY_CRON = process.env.STAFF_OVERSTAY_CRON || "*/15 * * * *";

// entryTime se ab tak kitne ghante hue (1 decimal).
export function hoursInside(entryTime, now = new Date()) {
  if (!entryTime) return 0;
  return Math.round(((now - new Date(entryTime)) / (60 * 60 * 1000)) * 10) / 10;
}

// Daily staff kaun hai. Purane records me staffType field hi nahi tha
// (schema default sirf naye docs par lagta hai), isliye sirf explicitly
// "One-time" wale ko hi exclude karte hain.
export function isDailyStaff(staff) {
  return !!staff && staff.staffType !== "One-time";
}

// One-time (technician / delivery) staff.
export function isOneTimeStaff(staff) {
  return !!staff && staff.staffType === "One-time";
}

// Is staff par kaunsa overstay threshold lagta hai.
export function overstayMsFor(staff) {
  return isOneTimeStaff(staff) ? ONE_TIME_OVERSTAY_MS : STAFF_OVERSTAY_MS;
}

export function overstayHoursFor(staff) {
  return isOneTimeStaff(staff) ? ONE_TIME_OVERSTAY_HOURS : STAFF_OVERSTAY_HOURS;
}

// Ek attendance record abhi overstay me hai ya nahi.
// thresholdMs na do to daily staff ka threshold lagta hai (backward compatible).
export function isOverstay(attendance, now = new Date(), thresholdMs = STAFF_OVERSTAY_MS) {
  if (!attendance?.entryTime || attendance.exitTime) return false;
  return now - new Date(attendance.entryTime) > thresholdMs;
}
