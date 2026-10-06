// Daily staff overstay / overtime rule.
// Agar koi Daily staff entry ke baad itne ghante tak andar hai aur exit
// mark nahi hua, to guard ko security alert bhejo.
export const STAFF_OVERSTAY_HOURS = Number(process.env.STAFF_OVERSTAY_HOURS) || 4;

export const STAFF_OVERSTAY_MS = STAFF_OVERSTAY_HOURS * 60 * 60 * 1000;

// Itne ghante se purane open records par alert nahi bhejte. Ye abandoned
// records hote hain (guard exit mark karna bhool gaya) — un par "3000 hrs
// inside" ka alert actionable nahi, sirf noise hai.
export const STAFF_OVERSTAY_MAX_AGE_HOURS =
  Number(process.env.STAFF_OVERSTAY_MAX_AGE_HOURS) || 48;

export const STAFF_OVERSTAY_MAX_AGE_MS =
  STAFF_OVERSTAY_MAX_AGE_HOURS * 60 * 60 * 1000;

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

// Ek attendance record abhi overstay me hai ya nahi.
export function isOverstay(attendance, now = new Date()) {
  if (!attendance?.entryTime || attendance.exitTime) return false;
  return now - new Date(attendance.entryTime) > STAFF_OVERSTAY_MS;
}
