/**
 * Flat list ko normalize karta hai.
 *
 * Input teen tarah se aa sakta hai, kyunki form-data array nahi bhej pata:
 *   ["A-101", "B-202"]        -> JSON body se
 *   '["A-101","B-202"]'       -> multipart field me JSON string
 *   "A-101, B-202"            -> comma separated string
 *   "A-101"                   -> ek hi flat
 *
 * Har case me saaf array milta hai: trimmed, khaali hataye hue, duplicate hataye hue.
 *
 * @param {*} input  flatNumbers ya legacy flatNumber
 * @returns {string[]}
 */
export function normalizeFlatNumbers(input) {
  if (input == null) return [];

  let list = [];

  if (Array.isArray(input)) {
    list = input;
  } else if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];

    // Multipart me array JSON string ban kar aata hai
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        list = Array.isArray(parsed) ? parsed : [trimmed];
      } catch {
        list = trimmed.split(",");
      }
    } else {
      list = trimmed.split(",");
    }
  } else {
    return [];
  }

  const seen = new Set();
  const out = [];

  for (const item of list) {
    if (typeof item !== "string") continue;
    const flat = item.trim();
    if (!flat) continue;

    const key = flat.toLowerCase();
    if (seen.has(key)) continue; // same flat do baar na aaye
    seen.add(key);
    out.push(flat);
  }

  return out;
}

/**
 * Request body se flats nikalo - naya `flatNumbers` ya purana `flatNumber`,
 * jo bhi mile.
 *
 * @param {Object} body
 * @returns {string[]}
 */
export function flatsFromBody(body = {}) {
  const fromNew = normalizeFlatNumbers(body.flatNumbers);
  if (fromNew.length) return fromNew;
  return normalizeFlatNumbers(body.flatNumber);
}
